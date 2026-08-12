import { Router } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { siteContentController } from "../../../siteContent/infra/container";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.get("/public", (req, res) => siteContentController.getPublic(req, res));

router.get("/", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  siteContentController.getAdmin(req, res),
);

router.patch("/", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  siteContentController.update(req, res),
);

export { router as siteContentRoutes };
