import { prisma } from "../../../../package/prisma";
import { PrismaDashboardRepository } from "../../domain/repositories/PrismaDashboardRepository";
import { GetDashboardDataUseCase } from "../../usecases/GetDashboardDataUseCase";
import { DashboardController } from "../controllers/DashboardController";
import { notificationRepository, createNotificationUseCase } from "../../../notification/infra/container";
import { NotifyInactiveMembersUseCase } from "../../../notification/usecases/NotifyInactiveMembersUseCase";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";

const dashboardRepository = new PrismaDashboardRepository(prisma);
const notifyInactiveMembers = new NotifyInactiveMembersUseCase(prisma, notificationRepository, createNotificationUseCase, whatsAppService);
const getDashboard = new GetDashboardDataUseCase(dashboardRepository, notifyInactiveMembers);

export const dashboardController = new DashboardController(getDashboard);
