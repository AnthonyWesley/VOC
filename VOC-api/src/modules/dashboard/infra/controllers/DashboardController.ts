import { Request, Response } from "express";
import { GetDashboardDataUseCase } from "../../usecases/GetDashboardDataUseCase";

export class DashboardController {
  constructor(
    private readonly getDashboardDataUseCase: GetDashboardDataUseCase,
  ) {}

  async getDashboard(request: Request, response: Response): Promise<Response> {
    const result = await this.getDashboardDataUseCase.execute();

    return response.status(200).json(result);
  }
}
