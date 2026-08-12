import { Router } from "express";
import { memberController } from "../../../membership/infra/container";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.post("/public/register", (req, res) =>
  memberController.register(req, res),
);

router.patch("/me/complete-profile", auth, (req, res) =>
  memberController.completeProfile(req, res),
);

router.post("/", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  memberController.create(req, res),
);

router.get("/:memberId", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  memberController.get(req, res),
);

router.patch("/:memberId", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  memberController.update(req, res),
);

router.get("/", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  memberController.list(req, res),
);

router.patch("/:memberId/delete", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  memberController.delete(req, res),
);

router.patch("/:memberId/restore", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  memberController.restore(req, res),
);

export { router as memberRoutes };
