import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { PrismaNotificationRepository } from "../../modules/notification/domain/repositories/PrismaNotificationRepository";
import { CreateNotificationUseCase } from "../../modules/notification/usecases/CreateNotificationUseCase";
import { NotifyInactiveMembersUseCase } from "../../modules/notification/usecases/NotifyInactiveMembersUseCase";
import { whatsAppService } from "../whatsapp/whatsappContainer";

const prisma = new PrismaClient();
const notificationRepository = new PrismaNotificationRepository(prisma);
const createNotification = new CreateNotificationUseCase(notificationRepository);
const notifyInactiveMembers = new NotifyInactiveMembersUseCase(
  prisma,
  notificationRepository,
  createNotification,
  whatsAppService,
);

export function startInactiveMembersCron() {
  // Executa toda segunda-feira às 8h
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
