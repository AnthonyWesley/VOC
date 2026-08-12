import { Router } from "express";
import type { Request, RequestHandler } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";
import { createLogger } from "../../../../shared/logger/logger";
import { whatsappAdminFailureToHttpError } from "../../../../infra/whatsapp/whatsappAdminErrorMapper";
import { isPrismaUniqueViolation } from "../../../../shared/utils/isPrismaUniqueViolation";
import type { IWhatsAppAdminService } from "../../../../infra/whatsapp/IWhatsAppAdminService";
import type { WhatsAppInstanceRepository } from "../../../../infra/whatsapp/WhatsAppInstanceRepository";
import { createInstanceHttpSchema, instanceParamsSchema } from "../../../../infra/whatsapp/whatsappAdminSchemas";
import { PrismaClient } from "@prisma/client";

const logger = createLogger("whatsapp-routes");

export type WhatsAppRoutesDependencies = {
  adminService: IWhatsAppAdminService;
  instanceRepository: WhatsAppInstanceRepository;
  limiter: RequestHandler;
  prisma: PrismaClient;
};

export function createWhatsAppRoutes(deps: WhatsAppRoutesDependencies): Router {
  const router = Router();
  const jwtProvider = new JwtProvider();
  const auth = makeAuthMiddleware(jwtProvider);

  router.get(
    "/instance",
    auth,
    requireLevel(LEVEL.PRESIDENT),
    async (req, res, next) => {
      try {
        const userId = req.auth!.userId;

        const instance = await deps.instanceRepository.findActiveByUserId(userId);
        if (!instance) {
          return res.status(404).json({ code: "WHATSAPP_INSTANCE_NOT_FOUND", message: "Nenhuma instância ativa encontrada" });
        }

        const stateResult = await deps.adminService.connectionState(instance.instanceName);

        return res.json({
          instance: {
            id: instance.id,
            instanceName: instance.instanceName,
            number: instance.number,
            isActive: instance.isActive,
            state: stateResult.ok ? stateResult.value : "UNKNOWN",
            createdAt: instance.createdAt,
            updatedAt: instance.updatedAt,
          },
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/instance",
    auth,
    requireLevel(LEVEL.PRESIDENT),
    deps.limiter,
    async (req, res, next) => {
      try {
        const userId = req.auth!.userId;
        const parsed = createInstanceHttpSchema.parse(req.body);

        const existing = await deps.instanceRepository.findByInstanceName(parsed.instanceName);
        if (existing) {
          return res.status(409).json({ code: "WHATSAPP_INSTANCE_ALREADY_EXISTS", message: "Instância já existe" });
        }

        const result = await deps.adminService.createInstance({ instanceName: parsed.instanceName });

        if (!result.ok) {
          throw whatsappAdminFailureToHttpError(result.code);
        }

        try {
          await deps.instanceRepository.create({
            instanceName: parsed.instanceName,
            userId,
            isActive: true,
          });
        } catch (persistError: unknown) {
          if (isPrismaUniqueViolation(persistError)) {
            const winner = await deps.instanceRepository.findByInstanceName(parsed.instanceName);
            if (winner) {
              return res.status(409).json({ code: "WHATSAPP_INSTANCE_ALREADY_EXISTS", message: "Instância já existe" });
            }
          }

          void deps.adminService.deleteInstance(parsed.instanceName)
            .then((compResult) => {
              if (!compResult.ok && compResult.code !== "INSTANCE_NOT_FOUND") {
                logger.warn({ operation: "whatsapp_create_compensation", failureCode: compResult.code, providerStatus: compResult.providerStatus }, "Compensation delete failed");
              }
            })
            .catch((compErr: unknown) => {
              logger.error({ operation: "whatsapp_create_compensation", failureCode: "UNEXPECTED_COMPENSATION_ERROR", error: compErr }, "Compensation threw unexpectedly");
            });

          throw persistError;
        }

        return res.status(201).json({
          instanceName: parsed.instanceName,
          qrcode: result.value.qrcode ?? null,
          pairingCode: result.value.pairingCode ?? null,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/instance/:instanceName/qrcode",
    auth,
    requireLevel(LEVEL.PRESIDENT),
    deps.limiter,
    async (req, res, next) => {
      try {
        const parsed = instanceParamsSchema.parse(req.params);
        const instanceName = parsed.instanceName;

        const local = await deps.instanceRepository.findActiveByName(instanceName);
        if (!local) {
          return res.status(404).json({ code: "WHATSAPP_INSTANCE_NOT_FOUND", message: "Instância não encontrada" });
        }

        const result = await deps.adminService.getQrCode(instanceName);

        if (!result.ok) {
          throw whatsappAdminFailureToHttpError(result.code);
        }

        return res.json({
          qrcode: result.value.qrcode,
          pairingCode: result.value.pairingCode,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/instance/:instanceName/state",
    auth,
    requireLevel(LEVEL.PRESIDENT),
    async (req, res, next) => {
      try {
        const parsed = instanceParamsSchema.parse(req.params);

        const local = await deps.instanceRepository.findActiveByName(parsed.instanceName);
        if (!local) {
          return res.status(404).json({ code: "WHATSAPP_INSTANCE_NOT_FOUND", message: "Instância não encontrada" });
        }

        const stateResult = await deps.adminService.connectionState(parsed.instanceName);

        if (stateResult.ok) {
          return res.json({ state: stateResult.value });
        }

        logger.warn({ operation: "whatsapp_connection_state", resultCode: stateResult.code }, "State check failed");
        return res.json({ state: "UNKNOWN" });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/instance/:instanceName",
    auth,
    requireLevel(LEVEL.PRESIDENT),
    deps.limiter,
    async (req, res, next) => {
      try {
        const parsed = instanceParamsSchema.parse(req.params);

        const result = await deps.adminService.deleteInstance(parsed.instanceName);

        if (!result.ok && result.code !== "INSTANCE_NOT_FOUND") {
          throw whatsappAdminFailureToHttpError(result.code);
        }

        await deps.instanceRepository.deleteByInstanceName(parsed.instanceName);

        return res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/instance/:instanceName/restart",
    auth,
    requireLevel(LEVEL.PRESIDENT),
    deps.limiter,
    async (req, res, next) => {
      try {
        const parsed = instanceParamsSchema.parse(req.params);

        const local = await deps.instanceRepository.findActiveByName(parsed.instanceName);
        if (!local) {
          return res.status(404).json({ code: "WHATSAPP_INSTANCE_NOT_FOUND", message: "Instância não encontrada" });
        }

        const result = await deps.adminService.restartInstance(parsed.instanceName);

        if (!result.ok) {
          throw whatsappAdminFailureToHttpError(result.code);
        }

        return res.json({ message: "Instância reiniciada" });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
