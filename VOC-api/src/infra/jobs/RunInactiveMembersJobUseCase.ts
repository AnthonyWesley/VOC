import { IJobLeaseRepository } from "./IJobLeaseRepository";
import { NotifyInactiveMembersUseCase } from "../../modules/notification/usecases/NotifyInactiveMembersUseCase";
import { JobTrigger, RunInactiveMembersJobResult } from "./types";
import { createLogger } from "../../shared/logger/logger";

const JOB_NAME = "inactive-members";
const OWNER_ID = () => `server-${process.pid}-${Date.now()}`;

export class RunInactiveMembersJobUseCase {
  private logger = createLogger("run-inactive-members-job");
  private readonly ownerId: string;

  constructor(
    private readonly jobLeaseRepo: IJobLeaseRepository,
    private readonly notifyInactiveMembers: NotifyInactiveMembersUseCase,
    private readonly leaseTtlSeconds: number,
  ) {
    this.ownerId = OWNER_ID();
  }

  async execute(trigger: JobTrigger): Promise<RunInactiveMembersJobResult> {
    const acquire = await this.jobLeaseRepo.tryAcquire({
      name: JOB_NAME,
      ownerId: this.ownerId,
      ttlSeconds: this.leaseTtlSeconds,
    });

    if (!acquire.acquired) {
      this.logger.info({ operation: "inactive_members_job", trigger, status: "SKIPPED" }, "Job already running on another instance");
      return { status: "SKIPPED", trigger, reason: "JOB_ALREADY_RUNNING" };
    }

    const start = Date.now();
    try {
      const summary = await this.notifyInactiveMembers.execute();

      this.logger.info(
        { operation: "inactive_members_job", trigger, status: "COMPLETED", durationMs: Date.now() - start, ...summary },
        "Inactive members job completed successfully",
      );

      return {
        status: "COMPLETED",
        trigger,
        durationMs: Date.now() - start,
        ...summary,
      };
    } finally {
      await this.jobLeaseRepo.release(JOB_NAME, this.ownerId).catch((err) => {
        this.logger.error({ operation: "inactive_members_job", err }, "Failed to release job lease");
      });
    }
  }
}
