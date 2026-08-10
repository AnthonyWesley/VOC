import { Router } from "express";
import { InstagramController } from "../controllers/InstagramController";

/**
 * @swagger
 * /instagram/media/public:
 *   get:
 *     summary: Lista midias recentes do Instagram da igreja
 *     tags: [Instagram]
 *     responses:
 *       200:
 *         description: Galeria do Instagram (cache de 15 min)
 */
const router = Router();
const instagramController = new InstagramController();

router.get("/media/public", (req, res) =>
  instagramController.listPublic(req, res),
);

export { router as instagramRoutes };