import { Router } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { dashboardController } from "../../../dashboard/infra/container";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.get("/", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  dashboardController.getDashboard(req, res),
);

export { router as dashboardRoutes };
