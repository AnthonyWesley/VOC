import { prisma } from "../../../../package/prisma";
import { PrismaDashboardRepository } from "../../domain/repositories/PrismaDashboardRepository";
import { GetDashboardDataUseCase } from "../../usecases/GetDashboardDataUseCase";
import { DashboardController } from "../controllers/DashboardController";

const dashboardRepository = new PrismaDashboardRepository(prisma);
const getDashboard = new GetDashboardDataUseCase(dashboardRepository);

export const dashboardController = new DashboardController(getDashboard);
