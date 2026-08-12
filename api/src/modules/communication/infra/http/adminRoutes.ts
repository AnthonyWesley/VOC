import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { makeAuthMiddleware } from "./middlewares/authMiddleware";
import { JwtProvider } from "../../../identity/infra/providers/JwtProvider";
import { requireLevel } from "./middlewares/requireLevel";
import { LEVEL } from "../../../../shared/constants/levels";
import { runInactiveMembersJob, jobLeaseRepository } from "../../../../infra/jobs/jobsContainer";

const router = Router();
const jwtProvider = new JwtProvider();
const auth = makeAuthMiddleware(jwtProvider);

const jobRunLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many requests. Try again later." },
});

router.post("/jobs/inactive-members/run", auth, requireLevel(LEVEL.PRESIDENT), jobRunLimiter, async (req: Request, res: Response) => {
  const result = await runInactiveMembersJob.execute("manual");

  if (result.status === "SKIPPED") {
    res.status(409).json({ status: "SKIPPED", message: "Job is already running on another instance" });
    return;
  }

  res.status(200).json(result);
});

router.get("/jobs/inactive-members", auth, requireLevel(LEVEL.PRESIDENT), async (req: Request, res: Response) => {
  const status = await jobLeaseRepository.getStatus("inactive-members");
  res.json({ name: "inactive-members", running: status.running, lockedUntil: status.lockedUntil });
});

export { router as adminRoutes };
