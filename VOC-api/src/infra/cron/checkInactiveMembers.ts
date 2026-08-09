import cron, { ScheduledTask } from "node-cron";
import { runInactiveMembersJob } from "../jobs/jobsContainer";
import { createLogger } from "../../shared/logger/logger";

const logger = createLogger("cron");

let task: ScheduledTask | null = null;

export function startInactiveMembersCron() {
  task = cron.schedule("0 8 * * 1", async () => {
    const result = await runInactiveMembersJob.execute("cron");
    logger.info({ status: result.status, trigger: result.trigger }, "Inactive members cron check");
  });

  logger.info({ operation: "inactive_members_job", schedule: "0 8 * * 1" }, "Inactive members check scheduled (weekly, Monday 8AM)");
}

export function stopInactiveMembersCron() {
  if (task) {
    task.stop();
    task = null;
    logger.info({ operation: "inactive_members_job" }, "Inactive members check stopped");
  }
}
