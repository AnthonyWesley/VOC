// identity/domain/repositories/IUserRepository.ts

import { GetFinancialRecordDetailedOutput } from "../../usecases/GetFinancialRecordByIdUseCase";
import { FinancialRecordListDTO } from "../../usecases/ListFinancialRecordsUseCase";
import { FinancialRecord } from "../entities/FinancialRecord";

export interface IFinancialRecordRepository {
  getFinancialRecordsByEventId(eventId: string): Promise<any[]>;
  findByIdDetailed(
    id: string,
  ): Promise<GetFinancialRecordDetailedOutput | null>;
  findById(id: string): Promise<FinancialRecord | null>;
  findAll(params?: { limit?: number; offset?: number; includeCancelled?: boolean }): Promise<FinancialRecordListDTO[]>;
  save(record: FinancialRecord): Promise<void>;
  create(record: FinancialRecord): Promise<void>;
}
