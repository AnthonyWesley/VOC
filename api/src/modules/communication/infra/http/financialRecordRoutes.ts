import { Router } from "express";
import { financialRecordController } from "../../../financialRecord/infra/container";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

router.post("/", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.create(req, res),
);

router.patch("/:recordId", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.update(req, res),
);

router.get("/:recordId", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.get(req, res),
);

router.get("/", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.list(req, res),
);

router.get("/event/:eventId", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.getByEvent(req, res),
);
router.patch("/:recordId/delete", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.delete(req, res),
);

router.post("/:recordId/reverse", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  financialRecordController.reverse(req, res),
);

export { router as financialRecordRoutes };
