import { Router } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { WhatsAppInstanceService } from "../../../../infra/whatsapp/WhatsAppInstanceService";
import { prisma } from "../../../../package/prisma";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);
const evolution = new WhatsAppInstanceService();

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

    let state = "close";
    try {
      state = await evolution.connectionState(instance.instanceName);
    } catch {}

    return res.json({
      instance: {
        id: instance.id,
        instanceName: instance.instanceName,
        number: instance.number,
        isActive: instance.isActive,
        state,
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
      const result = await evolution.createInstance(instanceName);

      await prisma.whatsAppInstance.create({
        data: {
          instanceName,
          apiKey: process.env.EVOLUTION_API_KEY ?? "",
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

    try {
      const state = await evolution.connectionState(instanceName);
      return res.json({ state });
    } catch {
      return res.json({ state: "close" });
    }
  },
);

router.delete(
  "/instance/:instanceName",
  auth,
  requireLevel(LEVEL.PRESIDENT),
  async (req, res) => {
    const instanceName = String(req.params.instanceName);

    try {
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
      await evolution.restartInstance(instanceName);
      return res.json({ message: "Instância reiniciada" });
    } catch {
      return res.status(500).json({ message: "Erro ao reiniciar instância" });
    }
  },
);

export { router as whatsappRoutes };
