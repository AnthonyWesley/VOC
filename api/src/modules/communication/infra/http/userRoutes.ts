import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userController } from "../../../identity/infra/container";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many password attempts. Try again later." },
});

// Rotas públicas
router.post("/login", loginLimiter, (req, res) => userController.login(req, res));
router.post("/refresh", (req, res) => userController.refresh(req, res));
router.post("/logout", (req, res) => userController.logout(req, res));
router.get("/me", auth, (req, res) => userController.getAuth(req, res));

router.post("/auth/update-temporary-password", passwordResetLimiter, (req, res) =>
  userController.updatePassword(req, res),
);

// Rotas protegidas — somente PRESIDENT
router.post("/", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.create(req, res),
);

router.get("/", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  userController.list(req, res),
);

router.get("/:userId", auth, requireLevel(LEVEL.MEMBER), (req, res) =>
  userController.get(req, res),
);

router.patch("/:userId", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.update(req, res),
);

router.patch("/:userId/assign", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.assignRole(req, res),
);

router.patch("/:userId/remove", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.removeRole(req, res),
);

router.patch("/:userId/activate", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.activate(req, res),
);

router.patch("/:userId/deactivate", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.deactivate(req, res),
);

router.patch("/:userId/admin-reset-password", auth, requireLevel(LEVEL.PRESIDENT), (req, res) =>
  userController.adminResetPassword(req, res),
);

export { router as userRoutes };
