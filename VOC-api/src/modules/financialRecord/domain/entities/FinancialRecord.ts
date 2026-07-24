import { PaymentMethod, TransactionDirection } from "@prisma/client";
import { generateId } from "../../../../shared/utils/generateId";
import { safeUpdate } from "../../../../shared/utils/safeUpdate";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoryProps } from "../../../category/domain/entities/Category";

export type FinancialRecordStatus = "ACTIVE" | "CANCELLED" | "REVERSED";

export type FinancialRecordProps = {
  id: string;
  amount: Decimal;
  method: PaymentMethod;
  date: Date;
  direction: TransactionDirection;
  status: FinancialRecordStatus;

  description?: string | null;
  categoryId: string;
  category?: CategoryProps | null;

  memberId?: string | null;
  eventId?: string | null;

  recordedById: string;

  cancelledAt?: Date | null;
  cancelledById?: string | null;
  cancelReason?: string | null;

  reversedAt?: Date | null;
  reversedById?: string | null;
  reverseReason?: string | null;

  reversalOfId?: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateFinancialRecordProps = {
  amount: Decimal;
  method: PaymentMethod;
  date: Date;
  direction: TransactionDirection;
  recordedById: string;
  categoryId: string;

  description?: string;
  memberId?: string;
  eventId?: string;
  reversalOfId?: string;
};

export class FinancialRecord {
  private constructor(private props: FinancialRecordProps) {}

  public static create(data: CreateFinancialRecordProps): FinancialRecord {
    if (!data.categoryId) throw new Error("CategoryId is required");
    if (!data.method) throw new Error("Payment method is required");
    if (!data.recordedById) throw new Error("RecordedById is required");
    if (!data.amount || data.amount.lte(0))
      throw new Error("Amount must be greater than zero");
    if (!data.direction) throw new Error("Direction is required");

    const now = new Date();
    return new FinancialRecord({
      id: generateId(),
      amount: data.amount,
      method: data.method,
      date: data.date,
      direction: data.direction,
      status: "ACTIVE",
      categoryId: data.categoryId,
      memberId: data.memberId ?? null,
      eventId: data.eventId ?? null,
      description: data.description ?? null,
      recordedById: data.recordedById,
      reversalOfId: data.reversalOfId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static rehydrate(props: FinancialRecordProps): FinancialRecord {
    return new FinancialRecord({ ...props });
  }

  public update(
    data: Partial<
      Omit<FinancialRecordProps, "id" | "direction" | "amount" | "recordedById" | "createdAt" | "status" | "reversalOfId" | "cancelledAt" | "cancelledById" | "cancelReason" | "reversedAt" | "reversedById" | "reverseReason">
    >,
  ): void {
    if (this.props.status !== "ACTIVE") {
      throw new ConflictError("CANNOT_UPDATE_NON_ACTIVE_RECORD");
    }
    if (this.props.reversalOfId) {
      throw new ConflictError("CANNOT_UPDATE_REVERSAL_RECORD");
    }

    const changed = safeUpdate(this.props, data, [
      "method", "date", "description", "categoryId", "memberId", "eventId",
    ]);

    if (changed) this.props.updatedAt = new Date();
  }

  public cancel(cancelledById: string, reason?: string, now = new Date()): void {
    if (this.props.reversalOfId) {
      throw new ConflictError("CANNOT_CANCEL_REVERSAL");
    }
    if (this.props.cancelledAt) {
      throw new ConflictError("FINANCIAL_RECORD_ALREADY_CANCELLED");
    }
    if (this.props.status === "REVERSED") {
      throw new ConflictError("CANNOT_CANCEL_REVERSED");
    }

    this.props.status = "CANCELLED";
    this.props.cancelledAt = now;
    this.props.cancelledById = cancelledById;
    this.props.cancelReason = reason?.trim() || null;
    this.props.updatedAt = now;
  }

  public reverse(reversedById: string, reason?: string, now = new Date()): void {
    if (this.props.reversalOfId) {
      throw new ConflictError("CANNOT_REVERSE_REVERSAL");
    }
    if (this.props.status === "CANCELLED") {
      throw new ConflictError("FINANCIAL_RECORD_ALREADY_CANCELLED");
    }
    if (this.props.status === "REVERSED") {
      throw new ConflictError("FINANCIAL_RECORD_ALREADY_REVERSED");
    }

    this.props.status = "REVERSED";
    this.props.reversedAt = now;
    this.props.reversedById = reversedById;
    this.props.reverseReason = reason?.trim() || null;
    this.props.updatedAt = now;
  }

  public get isCancelled(): boolean {
    return this.props.status === "CANCELLED";
  }

  public get isReversed(): boolean {
    return this.props.status === "REVERSED";
  }

  public get isReversal(): boolean {
    return !!this.props.reversalOfId;
  }

  public get id(): string { return this.props.id; }
  public get amount(): Decimal { return this.props.amount; }
  public get method(): PaymentMethod { return this.props.method; }
  public get date(): Date { return this.props.date; }
  public get direction(): TransactionDirection { return this.props.direction; }
  public get description(): string | null { return this.props.description ?? null; }
  public get category(): CategoryProps | null { return this.props.category ?? null; }
  public get categoryId(): string { return this.props.categoryId; }
  public get memberId(): string | null { return this.props.memberId ?? null; }
  public get eventId(): string | null { return this.props.eventId ?? null; }
  public get recordedById(): string { return this.props.recordedById; }
  public get status(): FinancialRecordStatus { return this.props.status; }
  public get cancelledAt(): Date | null | undefined { return this.props.cancelledAt; }
  public get cancelledById(): string | null | undefined { return this.props.cancelledById; }
  public get cancelReason(): string | null | undefined { return this.props.cancelReason; }
  public get reversedAt(): Date | null | undefined { return this.props.reversedAt; }
  public get reversedById(): string | null | undefined { return this.props.reversedById; }
  public get reverseReason(): string | null | undefined { return this.props.reverseReason; }
  public get reversalOfId(): string | null | undefined { return this.props.reversalOfId; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
}
