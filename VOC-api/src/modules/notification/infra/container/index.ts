import { prisma } from "../../../../package/prisma";
import { PrismaNotificationRepository } from "../../domain/repositories/PrismaNotificationRepository";
import { ListNotificationsUseCase } from "../../usecases/ListNotificationsUseCase";
import { MarkAsReadUseCase } from "../../usecases/MarkAsReadUseCase";
import { CreateNotificationUseCase } from "../../usecases/CreateNotificationUseCase";
import { NotificationController } from "../controllers/NotificationController";

const notificationRepository = new PrismaNotificationRepository(prisma);
const listNotificationsUseCase = new ListNotificationsUseCase(notificationRepository);
const markAsReadUseCase = new MarkAsReadUseCase(prisma);
const createNotificationUseCase = new CreateNotificationUseCase(notificationRepository);

const notificationController = new NotificationController(
  listNotificationsUseCase,
  markAsReadUseCase,
);

export {
  notificationController,
  createNotificationUseCase,
  notificationRepository,
  markAsReadUseCase,
  listNotificationsUseCase,
};
