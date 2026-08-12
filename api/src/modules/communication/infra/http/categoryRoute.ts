// src/shared/infra/http/routes/categoryRoutes.ts
import { Router } from "express";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { requireLevel } from "./middlewares/requireLevel";
import { categoryController } from "../../../category/infra/container";
import { LEVEL } from "../../../../shared/constants/levels";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

// Criar ou atualizar categoria
router.post("/", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  categoryController.upsert(req, res),
);

// Buscar categoria por ID
router.get("/:categoryId", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  categoryController.getById(req, res),
);

// Listar todas categorias
router.get("/", auth, requireLevel(LEVEL.TREASURER), (req, res) =>
  categoryController.list(req, res),
);

export { router as categoryRoutes };
