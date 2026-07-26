import cron from "node-cron";
import { prisma } from "../../package/prisma";
import { notificationRepository, createNotificationUseCase } from "../../modules/notification/infra/container";
import { NotifyInactiveMembersUseCase } from "../../modules/notification/usecases/NotifyInactiveMembersUseCase";
import { whatsAppService } from "../whatsapp/whatsappContainer";

const notifyInactiveMembers = new NotifyInactiveMembersUseCase(
  prisma,
  notificationRepository,
  createNotificationUseCase,
  whatsAppService,
);

export function startInactiveMembersCron() {
  cron.schedule("0 8 * * 1", async () => {
    console.log("[CRON] Checking inactive members...");
    try {
      await notifyInactiveMembers.execute();
      console.log("[CRON] Inactive members check completed");
    } catch (error) {
      console.error("[CRON] Error checking inactive members:", error);
    }
  });

  console.log("[CRON] Inactive members check scheduled (weekly, Monday 8AM)");
}
