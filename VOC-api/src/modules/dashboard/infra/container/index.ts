import { prisma } from "../../../../package/prisma";
import { PrismaDashboardRepository } from "../../domain/repositories/PrismaDashboardRepository";
import { GetDashboardDataUseCase } from "../../usecases/GetDashboardDataUseCase";
import { DashboardController } from "../controllers/DashboardController";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";
import { CreateNotificationUseCase } from "../../../notification/usecases/CreateNotificationUseCase";
import { NotifyInactiveMembersUseCase } from "../../../notification/usecases/NotifyInactiveMembersUseCase";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";

const dashboardRepository = new PrismaDashboardRepository(prisma);
const notificationRepository = new PrismaNotificationRepository(prisma);
const createNotification = new CreateNotificationUseCase(notificationRepository);
const notifyInactiveMembers = new NotifyInactiveMembersUseCase(prisma, notificationRepository, createNotification, whatsAppService);
const getDashboard = new GetDashboardDataUseCase(dashboardRepository, notifyInactiveMembers);

export const dashboardController = new DashboardController(getDashboard);
