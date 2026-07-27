import { IDashboardRepository } from "../domain/repositories/IDashboardRepository";

export class GetDashboardDataUseCase {
  constructor(
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute() {
    return this.dashboardRepo.getDashboardData();
  }
}
