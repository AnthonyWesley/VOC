import { GetFinancialRecordDetailedOutput } from "../../usecases/GetFinancialRecordByIdUseCase";
import { FinancialRecordListDTO } from "../../usecases/ListFinancialRecordsUseCase";
import { FinancialRecord } from "../entities/FinancialRecord";

export interface IFinancialRecordRepository {
  getFinancialRecordsByEventId(eventId: string): Promise<any[]>;
  findByIdDetailed(id: string): Promise<GetFinancialRecordDetailedOutput | null>;
  findById(id: string): Promise<FinancialRecord | null>;
  findByReversalOfId(reversalOfId: string): Promise<FinancialRecord | null>;
  findAll(params?: { limit?: number; offset?: number; includeCancelled?: boolean }): Promise<FinancialRecordListDTO[]>;

  create(record: FinancialRecord): Promise<void>;
  update(record: FinancialRecord): Promise<void>;

  markAsReversedIfActive(input: {
    id: string;
    reversedAt: Date;
    reversedById: string;
    reverseReason?: string | null;
  }): Promise<boolean>;

  markAsCancelledIfActive(input: {
    id: string;
    cancelledAt: Date;
    cancelledById: string;
    cancelReason?: string | null;
  }): Promise<boolean>;
}
