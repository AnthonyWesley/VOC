import { Router } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";
import { prisma } from "../../../../package/prisma";
import { LEVEL } from "../../../../shared/constants/levels";
import { createLogger } from "../../../../shared/logger/logger";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);
const logger = createLogger("whatsapp-routes");

router.get(
  "/instance",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const userId = req.auth!.userId;

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { userId, isActive: true },
    });

    if (!instance) {
      return res.json({ instance: null });
    }

    const stateResult = await whatsAppService.connectionState(instance.instanceName);

    return res.json({
      instance: {
        id: instance.id,
        instanceName: instance.instanceName,
        number: instance.number,
        isActive: instance.isActive,
        state: stateResult.ok ? stateResult.state : "UNKNOWN",
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
      },
    });
  },
);

router.post(
  "/instance",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const userId = req.auth!.userId;
    const { instanceName } = req.body;

    if (!instanceName) {
      return res
        .status(400)
        .json({ message: "Nome da instância é obrigatório" });
    }

    const existing = await prisma.whatsAppInstance.findUnique({
      where: { instanceName },
    });
    if (existing) {
      return res.status(409).json({ message: "Instância já existe" });
    }

    try {
      const evolution = whatsAppService as any;
      const result = await evolution.createInstance(instanceName);

      await prisma.whatsAppInstance.create({
        data: {
          instanceName,
          userId,
          isActive: true,
        },
      });

      return res.json({
        instanceName,
        qrcode: result?.base64 ?? null,
        pairingCode: result?.qrcode ?? null,
      });
    } catch (err: any) {
      logger.warn({ operation: "whatsapp_create_instance", errorCode: "CREATE_FAILED" }, err.message ?? "Erro ao criar instância");
      return res
        .status(500)
        .json({ message: err.message ?? "Erro ao criar instância" });
    }
  },
);

router.get(
  "/instance/:instanceName/qrcode",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const instanceName = String(req.params.instanceName);

    try {
      const evolution = whatsAppService as any;
      const result = await evolution.getQrCode(instanceName);
      return res.json({
        qrcode: result?.base64 ?? null,
        pairingCode: result?.qrcode ?? null,
      });
    } catch {
      return res.status(500).json({ message: "Erro ao obter QR Code" });
    }
  },
);

router.get(
  "/instance/:instanceName/state",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const instanceName = String(req.params.instanceName);

    const stateResult = await whatsAppService.connectionState(instanceName);

    if (stateResult.ok) {
      return res.json({ state: stateResult.state });
    }

    logger.warn({ operation: "whatsapp_connection_state", resultCode: stateResult.code }, "State check failed");
    return res.json({ state: "UNKNOWN" });
  },
);

router.delete(
  "/instance/:instanceName",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const instanceName = String(req.params.instanceName);

    try {
      const evolution = whatsAppService as any;
      await evolution.deleteInstance(instanceName);
    } catch {}

    await prisma.whatsAppInstance.deleteMany({ where: { instanceName } });

    return res.status(204).send();
  },
);

router.post(
  "/instance/:instanceName/restart",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const instanceName = String(req.params.instanceName);

    try {
      const evolution = whatsAppService as any;
      await evolution.restartInstance(instanceName);
      return res.json({ message: "Instância reiniciada" });
    } catch {
      return res.status(500).json({ message: "Erro ao reiniciar instância" });
    }
  },
);

export { router as whatsappRoutes };
