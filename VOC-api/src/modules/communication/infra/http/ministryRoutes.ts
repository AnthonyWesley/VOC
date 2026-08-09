import { Router } from "express";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { ministryController } from "../../../ministry/infra/container";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.post("/", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  ministryController.create(req, res),
);

router.patch("/:ministryId", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  ministryController.update(req, res),
);

router.get("/:ministryId", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  ministryController.get(req, res),
);

router.get("/", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  ministryController.list(req, res),
);

router.patch("/:ministryId/assignMember", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  ministryController.assignMember(req, res),
);

router.patch("/:ministryId/removeMember", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  ministryController.removeMember(req, res),
);

router.patch("/:ministryId/delete", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  ministryController.delete(req, res),
);

router.patch("/:ministryId/restore", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  ministryController.restore(req, res),
);

export { router as ministryRoutes };
