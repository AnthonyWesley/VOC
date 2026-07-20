import { IDashboardRepository } from "../domain/repositories/IDashboardRepository";
import { NotifyInactiveMembersUseCase } from "../../notification/usecases/NotifyInactiveMembersUseCase";

export class GetDashboardDataUseCase {
  constructor(
    private readonly dashboardRepo: IDashboardRepository,
    private readonly notifyInactiveMembers?: NotifyInactiveMembersUseCase,
  ) {}

  async execute() {
    const data = this.dashboardRepo.getDashboardData();
    const notification = this.notifyInactiveMembers?.execute();

    const [dashboardData] = await Promise.all([data, notification]);
    return dashboardData;
  }
}
