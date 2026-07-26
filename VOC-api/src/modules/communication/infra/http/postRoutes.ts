import { Router } from "express";
import { postController } from "../../../post/infra/container";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

// Rotas públicas
router.get("/public", (req, res) => postController.listPublic(req, res));
router.get("/:postId/public", (req, res) => postController.getPublic(req, res));

// Rotas protegidas
router.get("/", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  postController.list(req, res),
);

router.get("/:postId", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  postController.get(req, res),
);

// Criação/edição de posts (40+)
router.post("/", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  postController.create(req, res),
);

router.patch("/:postId", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  postController.update(req, res),
);

// Transições de estado (40+)
router.post("/:postId/publish", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  postController.publish(req, res),
);

router.post("/:postId/archive", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  postController.archive(req, res),
);

router.delete("/:postId", auth, requireLevel(LEVEL.MINISTRY_LEADER), (req, res) =>
  postController.delete(req, res),
);

export { router as postRoutes };
