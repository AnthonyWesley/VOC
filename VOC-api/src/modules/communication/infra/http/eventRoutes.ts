import { Router } from "express";
import { eventController } from "../../../event/infra/container";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.post("/", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  eventController.create(req, res),
);

router.patch("/:eventId", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  eventController.update(req, res),
);

router.get("/monthly-report", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  eventController.monthlyReport(req, res),
);

router.get("/:eventId", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  eventController.get(req, res),
);

router.get("/", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  eventController.list(req, res),
);

router.patch("/:eventId/delete", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  eventController.delete(req, res),
);

router.patch("/:eventId/assignMember", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  eventController.assignMember(req, res),
);

router.patch("/:eventId/removeMember", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  eventController.removeMember(req, res),
);

router.post("/:eventId/cancel", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  eventController.cancel(req, res),
);

router.patch("/:eventId/correct", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  eventController.correct(req, res),
);

export { router as eventRoutes };
