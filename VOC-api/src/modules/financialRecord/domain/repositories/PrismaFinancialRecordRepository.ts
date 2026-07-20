// identity/infra/repositories/PrismaFinancialRecordRepository.ts

import { PrismaClient, TransactionDirection } from "@prisma/client";
import { FinancialRecord } from "../../domain/entities/FinancialRecord";
import { IFinancialRecordRepository } from "./IFinancialRecordRepository";
import { GetFinancialRecordDetailedOutput } from "../../usecases/GetFinancialRecordByIdUseCase";
import { Decimal } from "@prisma/client/runtime/library";
import { FinancialRecordListDTO } from "../../usecases/ListFinancialRecordsUseCase";

export class PrismaFinancialRecordRepository implements IFinancialRecordRepository {
  constructor(private prisma: PrismaClient) {}

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
              select: {
                role: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
        category: { select: { id: true, name: true, type: true } },
      },
    });
  }

  // -----------------------------------------
  // FIND BY ID (DETAILED DTO)
  // -----------------------------------------
  async findByIdDetailed(
    id: string,
  ): Promise<GetFinancialRecordDetailedOutput | null> {
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
              select: {
                role: { select: { name: true } },
              },
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
      direction: record?.category?.type as TransactionDirection,
      status: record.status,

      category: record.category
        ? {
            id: record.category.id,
            name: record.category.name,
            type: record.category.type as TransactionDirection,
          }
        : null,

      member: record.member
        ? {
            id: record.member.id,
            fullName: record.member.fullName,
          }
        : null,

      event: record.event
        ? {
            id: record.event.id,
            title: record.event.title ?? null,
          }
        : null,

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
      reversedBy: record.reversedBy.length > 0 ? { id: record.reversedBy[0].id } : null,
    };
  }

  // -----------------------------------------
  // FIND BY ID (DOMAIN ENTITY)
  // -----------------------------------------
  async findById(id: string): Promise<FinancialRecord | null> {
    const data = await this.prisma.financialRecord.findUnique({
      where: { id },
    });

    if (!data) return null;

    return FinancialRecord.rehydrate({
      id: data.id,

      amount: new Decimal(data.amount.toString()),
      method: data.method,
      date: data.date,
      status: data.status as "ACTIVE" | "CANCELLED",

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

      reversalOfId: data.reversalOfId,
    });
  }

  // -----------------------------------------
  // FIND ALL
  // -----------------------------------------
  async findAll(params?: { limit?: number; offset?: number; includeCancelled?: boolean }): Promise<FinancialRecordListDTO[]> {
    const data = await this.prisma.financialRecord.findMany({
      where: params?.includeCancelled ? undefined : { cancelledAt: null },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
      include: {
        category: { select: { name: true, id: true, type: true } },
        recordedBy: {
          select: { member: { select: { fullName: true, id: true } } },
        },
      },
      orderBy: { date: "desc" },
    });

    return data.map((item) => ({
      id: item.id,

      amount: new Decimal(item.amount.toString()),
      method: item.method,
      date: item.date,
      direction: item?.category?.type || "EXPENSE",
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

  // -----------------------------------------
  // SAVE (UPSERT)
  // -----------------------------------------
  async save(record: FinancialRecord): Promise<void> {
    await this.prisma.financialRecord.upsert({
      where: { id: record.id },
      update: {
        amount: record.amount,
        method: record.method,
        date: record.date,
        status: record.status,

        description: record.description,
        memberId: record.memberId ?? null,
        eventId: record.eventId,

        recordedById: record.recordedById,
        cancelledAt: record.cancelledAt ?? null,
        cancelledById: record.cancelledById ?? null,
        cancelReason: record.cancelReason ?? null,

        updatedAt: record.updatedAt,
      },
      create: {
        id: record.id,
        amount: record.amount,
        method: record.method,
        date: record.date,
        status: record.status,

        description: record.description,
        categoryId: record.categoryId ?? "",

        memberId: record.memberId,
        eventId: record.eventId,

        recordedById: record.recordedById,

        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  // -----------------------------------------
  // CREATE (for reversal records)
  // -----------------------------------------
  async create(record: FinancialRecord): Promise<void> {
    await this.prisma.financialRecord.create({
      data: {
        id: record.id,
        amount: record.amount,
        method: record.method,
        date: record.date,
        status: record.status,

        description: record.description,
        categoryId: record.categoryId ?? "",

        memberId: record.memberId,
        eventId: record.eventId,

        recordedById: record.recordedById,

        reversalOfId: record.reversalOfId ?? null,

        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }
}
