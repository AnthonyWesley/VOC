import { Router } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { notificationController } from "../../../notification/infra/container";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.get("/", auth, requireLevel(LEVEL.MEMBER), (req, res) => notificationController.list(req, res));
router.patch("/:notificationId/read", auth, requireLevel(LEVEL.MEMBER), (req, res) => notificationController.markAsRead(req, res));

export { router as notificationRoutes };
