import { PrismaClient, TransactionDirection } from "@prisma/client";
import { FinancialRecord } from "../../domain/entities/FinancialRecord";
import { IFinancialRecordRepository } from "./IFinancialRecordRepository";
import { GetFinancialRecordDetailedOutput } from "../../usecases/GetFinancialRecordByIdUseCase";
import { Decimal } from "@prisma/client/runtime/library";
import { FinancialRecordListDTO } from "../../usecases/ListFinancialRecordsUseCase";

type FinancialRecordPrismaClient = Pick<PrismaClient, "financialRecord" | "category" | "member" | "event" | "user">;

export class PrismaFinancialRecordRepository implements IFinancialRecordRepository {
  constructor(private prisma: FinancialRecordPrismaClient) {}

  async getFinancialRecordsByEventId(eventId: string): Promise<any[]> {
    return this.prisma.financialRecord.findMany({
      where: { eventId },
      select: {
        id: true,
        amount: true,
        method: true,
        date: true,
        member: { select: { fullName: true } },
        recordedBy: {
          select: {
            email: true,
            member: { select: { fullName: true } },
            roles: {
              select: { role: { select: { name: true } } },
              take: 1,
            },
          },
        },
        category: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async findByIdDetailed(id: string): Promise<GetFinancialRecordDetailedOutput | null> {
    const record = await this.prisma.financialRecord.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, type: true } },
        member: { select: { id: true, fullName: true } },
        event: { select: { id: true, title: true } },
        recordedBy: {
          select: {
            id: true,
            member: { select: { id: true, fullName: true } },
            roles: {
              select: { role: { select: { name: true } } },
              take: 1,
            },
          },
        },
        reversalOf: { select: { id: true } },
        reversedBy: { select: { id: true } },
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      amount: record.amount.toNumber(),
      method: record.method,
      date: record.date,
      description: record.description,
      direction: record.direction as TransactionDirection,
      status: record.status,
      category: record.category
        ? { id: record.category.id, name: record.category.name, type: record.category.type as TransactionDirection }
        : null,
      member: record.member ? { id: record.member.id, fullName: record.member.fullName } : null,
      event: record.event ? { id: record.event.id, title: record.event.title ?? null } : null,
      recordedBy: {
        userId: record.recordedBy.id,
        fullName: record.recordedBy.member?.fullName ?? null,
        memberId: record.recordedBy.member?.id ?? null,
        roleName: record.recordedBy.roles?.[0]?.role?.name ?? null,
      },
      audit: {
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        cancelledAt: record.cancelledAt,
        cancelledById: record.cancelledById,
        cancelReason: record.cancelReason,
      },
      reversalOf: record.reversalOf ? { id: record.reversalOf.id } : null,
      reversedBy: record.reversedBy ? { id: record.reversedBy.id } : null,
    };
  }

  async findById(id: string): Promise<FinancialRecord | null> {
    const data = await this.prisma.financialRecord.findUnique({ where: { id } });
    if (!data) return null;

    return FinancialRecord.rehydrate({
      id: data.id,
      amount: new Decimal(data.amount.toString()),
      method: data.method,
      date: data.date,
      direction: data.direction as TransactionDirection,
      status: data.status as "ACTIVE" | "CANCELLED" | "REVERSED",
      description: data.description,
      categoryId: data.categoryId,
      memberId: data.memberId,
      eventId: data.eventId,
      recordedById: data.recordedById,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cancelledAt: data.cancelledAt,
      cancelledById: data.cancelledById,
      cancelReason: data.cancelReason,
      reversedAt: data.reversedAt,
      reversedById: data.reversedById,
      reverseReason: data.reverseReason,
      reversalOfId: data.reversalOfId,
    });
  }

  async findByReversalOfId(reversalOfId: string): Promise<FinancialRecord | null> {
    const data = await this.prisma.financialRecord.findFirst({ where: { reversalOfId } });
    if (!data) return null;

    return FinancialRecord.rehydrate({
      id: data.id,
      amount: new Decimal(data.amount.toString()),
      method: data.method,
      date: data.date,
      direction: data.direction as TransactionDirection,
      status: data.status as "ACTIVE" | "CANCELLED" | "REVERSED",
      description: data.description,
      categoryId: data.categoryId,
      memberId: data.memberId,
      eventId: data.eventId,
      recordedById: data.recordedById,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cancelledAt: data.cancelledAt,
      cancelledById: data.cancelledById,
      cancelReason: data.cancelReason,
      reversedAt: data.reversedAt,
      reversedById: data.reversedById,
      reverseReason: data.reverseReason,
      reversalOfId: data.reversalOfId,
    });
  }

  async findAll(params?: { limit?: number; offset?: number; includeCancelled?: boolean }): Promise<FinancialRecordListDTO[]> {
    const data = await this.prisma.financialRecord.findMany({
      where: params?.includeCancelled ? undefined : { status: { not: "CANCELLED" } },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
      include: {
        category: { select: { name: true, id: true, type: true } },
        recordedBy: { select: { member: { select: { fullName: true, id: true } } } },
      },
      orderBy: { date: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      amount: new Decimal(item.amount.toString()),
      method: item.method,
      date: item.date,
      direction: (item.direction ?? (item?.category?.type ?? "EXPENSE")) as TransactionDirection,
      status: item.status,
      category: item.category,
      recordedBy: {
        id: item.recordedBy.member?.id ?? null,
        fullName: item.recordedBy.member?.fullName ?? null,
      },
      createdAt: item.createdAt,
      cancelledAt: item.cancelledAt,
    }));
  }

  async create(record: FinancialRecord): Promise<void> {
    await this.prisma.financialRecord.create({
      data: {
        id: record.id,
        amount: record.amount,
        method: record.method,
        date: record.date,
        direction: record.direction,
        status: record.status,
        description: record.description,
        categoryId: record.categoryId,
        memberId: record.memberId,
        eventId: record.eventId,
        recordedById: record.recordedById,
        reversalOfId: record.reversalOfId ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  async update(record: FinancialRecord): Promise<void> {
    await this.prisma.financialRecord.update({
      where: { id: record.id },
      data: {
        amount: record.amount,
        method: record.method,
        date: record.date,
        direction: record.direction,
        status: record.status,
        description: record.description,
        categoryId: record.categoryId,
        memberId: record.memberId ?? null,
        eventId: record.eventId ?? null,
        recordedById: record.recordedById,
        reversalOfId: record.reversalOfId ?? null,
        cancelledAt: record.cancelledAt ?? null,
        cancelledById: record.cancelledById ?? null,
        cancelReason: record.cancelReason ?? null,
        reversedAt: record.reversedAt ?? null,
        reversedById: record.reversedById ?? null,
        reverseReason: record.reverseReason ?? null,
        updatedAt: record.updatedAt,
      },
    });
  }

  async markAsReversedIfActive(input: {
    id: string;
    reversedAt: Date;
    reversedById: string;
    reverseReason?: string | null;
  }): Promise<boolean> {
    const result = await this.prisma.financialRecord.updateMany({
      where: { id: input.id, status: "ACTIVE", reversalOfId: null },
      data: {
        status: "REVERSED",
        reversedAt: input.reversedAt,
        reversedById: input.reversedById,
        reverseReason: input.reverseReason ?? null,
      },
    });
    return result.count === 1;
  }

  async markAsCancelledIfActive(input: {
    id: string;
    cancelledAt: Date;
    cancelledById: string;
    cancelReason?: string | null;
  }): Promise<boolean> {
    const result = await this.prisma.financialRecord.updateMany({
      where: { id: input.id, status: "ACTIVE", reversalOfId: null },
      data: {
        status: "CANCELLED",
        cancelledAt: input.cancelledAt,
        cancelledById: input.cancelledById,
        cancelReason: input.cancelReason ?? null,
      },
    });
    return result.count === 1;
  }
}
