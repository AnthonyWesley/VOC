import { Router, Request, Response } from "express";
import { HealthController } from "./healthController";

export function createHealthRoutes(healthController: HealthController): Router {
  const router = Router();

  router.get("/live", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  router.get("/ready", async (_req: Request, res: Response) => {
    const result = await healthController.checkReadiness();
    const httpStatus = result.status === "error" ? 503 : 200;
    res.status(httpStatus).json(result);
  });

  return router;
}
