import { EventType } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";

export type GetMonthlyEventReportInput = {
  month: number;
  year: number;
  type?: EventType | null;
};

export class GetMonthlyEventReportUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: GetMonthlyEventReportInput) {
    return this.repository.getMonthlyReport(input);
  }
}
