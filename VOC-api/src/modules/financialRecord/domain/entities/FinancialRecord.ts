// identity/domain/entities/FinancialRecord.ts

import { PaymentMethod } from "@prisma/client";
import { generateId } from "../../../../shared/utils/generateId";
import { safeUpdate } from "../../../../shared/utils/safeUpdate";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoryProps } from "../../../category/domain/entities/Category";

export type FinancialRecordStatus = "ACTIVE" | "CANCELLED";

export type FinancialRecordProps = {
  id: string;
  amount: Decimal;
  method: PaymentMethod;
  date: Date;
  status: FinancialRecordStatus;

  description?: string | null;
  categoryId: string | null;
  category?: CategoryProps | null;

  memberId?: string | null;
  eventId?: string | null;

  recordedById: string;

  cancelledAt?: Date | null;
  cancelledById?: string | null;
  cancelReason?: string | null;

  reversalOfId?: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateFinancialRecordProps = {
  amount: Decimal;
  method: PaymentMethod;
  date: Date;
  recordedById: string;
  categoryId: string;

  description?: string;
  memberId?: string;
  eventId?: string;
  reversalOfId?: string;
};

export class FinancialRecord {
  private constructor(private props: FinancialRecordProps) {}

  // ---------------------------
  // CREATE
  // ---------------------------
  public static create(data: CreateFinancialRecordProps): FinancialRecord {
    if (!data.categoryId) throw new Error("CategoryId is required");
    if (!data.method) throw new Error("Payment method is required");
    if (!data.recordedById) throw new Error("RecordedById is required");
    if (!data.amount || data.amount.lte(0))
      throw new Error("Amount must be greater than zero");

    const now = new Date();
    return new FinancialRecord({
      id: generateId(),
      amount: data.amount,
      method: data.method,
      date: data.date,
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

  // ---------------------------
  // REHYDRATE
  // ---------------------------
  public static rehydrate(props: FinancialRecordProps): FinancialRecord {
    return new FinancialRecord({ ...props });
  }

  // ---------------------------
  // UPDATE
  // ---------------------------
  public update(
    data: Partial<
      Omit<FinancialRecordProps, "id" | "recordedById" | "createdAt" | "status" | "reversalOfId">
    >,
  ): void {
    if (data.amount !== undefined && data.amount.lte(0)) {
      throw new Error("Amount must be greater than zero");
    }

    const changed = safeUpdate(this.props, data, [
      "amount",
      "method",
      "date",
      "description",
      "categoryId",
      "memberId",
      "eventId",
    ]);

    if (changed) this.props.updatedAt = new Date();
  }

  // ---------------------------
  // CANCEL
  // ---------------------------
  public cancel(cancelledById: string, reason?: string): void {
    if (this.props.cancelledAt) {
      throw new ConflictError("FINANCIAL_RECORD_ALREADY_CANCELLED");
    }

    this.props.status = "CANCELLED";
    this.props.cancelledAt = new Date();
    this.props.cancelledById = cancelledById;
    this.props.cancelReason = reason ?? null;
    this.props.updatedAt = new Date();
  }

  // ---------------------------
  // IS CANCELLED
  // ---------------------------
  public get isCancelled(): boolean {
    return !!this.props.cancelledAt;
  }

  // ---------------------------
  // GETTERS
  // ---------------------------
  public get id(): string {
    return this.props.id;
  }
  public get amount(): Decimal {
    return this.props.amount;
  }
  public get method(): PaymentMethod {
    return this.props.method;
  }
  public get date(): Date {
    return this.props.date;
  }
  public get description(): string | null {
    return this.props.description ?? null;
  }
  public get category(): CategoryProps | null {
    return this.props.category ?? null;
  }
  public get categoryId(): string | null {
    return this.props.categoryId ?? null;
  }
  public get memberId(): string | null {
    return this.props.memberId ?? null;
  }
  public get eventId(): string | null {
    return this.props.eventId ?? null;
  }
  public get recordedById(): string {
    return this.props.recordedById;
  }
  public get status(): FinancialRecordStatus {
    return this.props.status;
  }
  public get cancelledAt(): Date | null | undefined {
    return this.props.cancelledAt;
  }
  public get cancelledById(): string | null | undefined {
    return this.props.cancelledById;
  }
  public get cancelReason(): string | null | undefined {
    return this.props.cancelReason;
  }
  public get reversalOfId(): string | null | undefined {
    return this.props.reversalOfId;
  }
  public get createdAt(): Date {
    return this.props.createdAt;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ---------------------------
  // DERIVED
  // ---------------------------
  // Direção derivada da categoria
  public get direction(): "INCOME" | "EXPENSE" | null {
    if (!this.props.category) return null;
    return this.props.category.type; // assume que type agora é INCOME / EXPENSE
  }
}
