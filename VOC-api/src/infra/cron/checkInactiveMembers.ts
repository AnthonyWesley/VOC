import cron from "node-cron";
import { prisma } from "../../package/prisma";
import { notificationRepository, createNotificationUseCase } from "../../modules/notification/infra/container";
import { NotifyInactiveMembersUseCase } from "../../modules/notification/usecases/NotifyInactiveMembersUseCase";
import { whatsAppService } from "../whatsapp/whatsappContainer";
import { createLogger } from "../../shared/logger/logger";

const logger = createLogger("cron");

const notifyInactiveMembers = new NotifyInactiveMembersUseCase(
  prisma,
  notificationRepository,
  createNotificationUseCase,
  whatsAppService,
);

export function startInactiveMembersCron() {
  cron.schedule("0 8 * * 1", async () => {
    logger.info({ operation: "inactive_members_job" }, "Checking inactive members...");
    try {
      await notifyInactiveMembers.execute();
      logger.info({ operation: "inactive_members_job" }, "Inactive members check completed");
    } catch (error) {
      logger.error({ operation: "inactive_members_job", err: error }, "Error checking inactive members");
    }
  });

  logger.info({ operation: "inactive_members_job", schedule: "0 8 * * 1" }, "Inactive members check scheduled (weekly, Monday 8AM)");
}
