import { generateId } from "../../../../shared/utils/generateId";
import { PrismaDatabaseClient } from "../../../../shared/infra/PrismaDatabaseClient";
import {
  AttendanceMode,
  EventStatus,
  EventType,
  Prisma,
} from "@prisma/client";
import { Event } from "../entities/Event";
import { EventAttendance } from "../entities/EventAttendance";
import { FinancialRecord } from "../../../financialRecord/domain/entities/FinancialRecord";
import { IEventRepository, MarkAsCancelledInput, MarkAsFinishedInput, EventRelationCounts } from "./IEventRepository";
import { DetailedEventDTO } from "../../usecases/GetEventDetailedUseCase";
import { buildMonthRangeUtc } from "../utils/zonedDateTime";
import { EventCursor } from "../utils/eventCursor";

export class PrismaEventRepository implements IEventRepository {
  private _timezone: string | null = null;

  constructor(private readonly db: PrismaDatabaseClient) {}

  private async getTimezone(): Promise<string> {
    if (!this._timezone) {
      const settings = await this.db.siteContentSettings.findUnique({ where: { id: "main" } });
      this._timezone = settings?.timezone ?? "America/Sao_Paulo";
    }
    return this._timezone;
  }

  async findDetailedEvent(id: string): Promise<DetailedEventDTO | null> {
    const data = await this.db.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        type: true,
        startsAt: true,
        endsAt: true,
        theme: true,
        notes: true,
        attendanceMode: true,

        preacherId: true,
        preacher: {
          select: {
            id: true,
            fullName: true,
            user: {
              select: {
                email: true,
                photoUrl: true,
              },
            },
          },
        },

        members: {
          select: {
            member: {
              select: {
                id: true,
                fullName: true,
                churchJoinDate: true,
                user: { select: { photoUrl: true } },
              },
            },
            joinedAt: true,
          },
        },

        assignments: {
          select: {
            id: true,
            memberId: true,
            ministryId: true,
            description: true,
            assignedAt: true,
            member: {
              select: {
                id: true,
                fullName: true,
                user: { select: { photoUrl: true } },
              },
            },
            ministry: { select: { id: true, name: true } },
          },
        },

        attendance: {
          select: {
            id: true,
            membersCount: true,
            visitorsCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        createdById: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            member: { select: { fullName: true } },
            roles: {
              select: { role: { select: { name: true } } },
              take: 1,
            },
          },
        },
        deletedAt: true,
        deletedById: true,
        deletedBy: { select: { id: true, email: true } },
        deleteReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!data) return null;

    // -----------------------------------------
    // AUTO-CALCULATE ATTENDANCE (INDIVIDUAL)
    // -----------------------------------------
    let autoMembersCount: number | null = null;
    let autoVisitorsCount: number | null = null;

    if (data.attendanceMode === "INDIVIDUAL") {
      const eventDate = data.startsAt;

      autoMembersCount = data.members.filter(
        (m) => m.member.churchJoinDate <= eventDate,
      ).length;

      autoVisitorsCount = data.members.filter(
        (m) => m.member.churchJoinDate > eventDate,
      ).length;
    }

    // -----------------------------------------
    // RETURN CLEAN DTO
    // -----------------------------------------
    return {
      id: data.id,
      title: data.title,
      type: data.type,
      attendanceMode: data.attendanceMode,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      theme: data.theme,
      notes: data.notes,

      preacherId: data.preacherId,
      preacher: data.preacher
        ? {
            id: data.preacher.id,
            fullName: data.preacher.fullName,
            email: data.preacher.user?.email ?? undefined,
            photoUrl: data.preacher.user?.photoUrl ?? undefined,
          }
        : null,

      members: data.members.map((m) => ({
        id: m.member.id,
        fullName: m.member.fullName,
        photoUrl: m.member.user?.photoUrl ?? undefined,
      })),

      assignments: data.assignments.map((a) => ({
        id: a.id,
        member: {
          id: a.memberId,
          fullName: a.member.fullName,
          photoUrl: a.member.user?.photoUrl ?? undefined,
        },
        ministry: {
          id: a.ministryId,
          name: a.ministry.name,
        },
        description: a.description,
        assignedAt: a.assignedAt,
      })),

      attendance:
        data.attendanceMode === "INDIVIDUAL"
          ? {
              membersCount: autoMembersCount!,
              visitorsCount: autoVisitorsCount!,
            }
          : data.attendance
            ? {
                membersCount: data.attendance.membersCount,
                visitorsCount: data.attendance.visitorsCount,
              }
            : null,

      createdById: data.createdById ?? null,
      createdBy: data.createdBy
        ? {
            id: data.createdBy.id,
            email: data.createdBy.email,
            fullName: data.createdBy.member?.fullName ?? null,
            roleName: data.createdBy.roles?.[0]?.role?.name ?? null,
          }
        : null,
      deletedAt: data.deletedAt,
      deletedById: data.deletedById ?? null,
      deletedBy: data.deletedBy
        ? { id: data.deletedBy.id, email: data.deletedBy.email }
        : null,
      deleteReason: data.deleteReason,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
  async findById(id: string): Promise<Event | null> {
    const data = await this.db.event.findUnique({
      where: { id },
    });

    if (!data) return null;

    return Event.rehydrate({
      id: data.id,
      title: data.title,
      type: data.type,
      status: data.status as EventStatus,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      preacherId: data.preacherId,
      attendanceMode: data.attendanceMode as AttendanceMode,
      needsScale: data.needsScale,
      theme: data.theme,
      notes: data.notes,
      createdById: data.createdById ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cancelledAt: data.cancelledAt,
      cancelledById: data.cancelledById,
      cancelReason: data.cancelReason,
      deletedAt: data.deletedAt,
    });
  }

  private async buildMonthRangeTz(year: number, month: number) {
    const tz = await this.getTimezone();
    if (month < 1 || month > 12) throw new Error("Invalid month");
    return buildMonthRangeUtc(tz, year, month);
  }

  async findAll(params: {
    limit: number;
    cursor?: EventCursor;
    type?: EventType | null;
    month?: number;
    year?: number;
  }): Promise<{
    events: Event[];
    nextCursor: EventCursor | null;
  }> {
    const { limit, cursor, type, month, year } = params;
    const range = await this.buildMonthRangeTz(year ?? new Date().getFullYear(), month ?? new Date().getMonth() + 1);

    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      startsAt: range,
    };

    if (type) where.type = type;

    let cursorCondition: Prisma.EventWhereInput | undefined;
    if (cursor) {
      const cursorStartsAt = new Date(cursor.startsAt);
      cursorCondition = {
        OR: [
          { startsAt: { lt: cursorStartsAt } },
          {
            startsAt: cursorStartsAt,
            id: { lt: cursor.id },
          },
        ],
      };
    }

    const data = await this.db.event.findMany({
      where: { ...where, ...(cursorCondition ? { AND: [where, cursorCondition] } : {}) },
      take: limit + 1,
      orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    });

    let nextCursor: EventCursor | null = null;
    if (data.length > limit) {
      const nextItem = data.pop()!;
      nextCursor = { startsAt: nextItem.startsAt.toISOString(), id: nextItem.id };
    }

    const events = data.map((item) =>
      Event.rehydrate({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status as EventStatus,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        attendanceMode: item.attendanceMode as AttendanceMode,
        needsScale: item.needsScale,
        preacherId: item.preacherId,
        theme: item.theme,
        notes: item.notes,
        createdById: item.createdById ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        cancelledAt: item.cancelledAt,
        cancelledById: item.cancelledById,
        cancelReason: item.cancelReason,
        deletedAt: item.deletedAt,
      }),
    );

    return { events, nextCursor };
  }

  async create(event: Event): Promise<void> {
    await this.db.event.create({
      data: {
        id: event.id,
        title: event.title,
        type: event.type,
        status: event.status,
        attendanceMode: event.attendanceMode,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        needsScale: event.needsScale,
        preacherId: event.preacherId,
        theme: event.theme,
        notes: event.notes,
        createdById: event.createdById ?? null,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  }

  async update(event: Event): Promise<void> {
    await this.db.event.update({
      where: { id: event.id },
      data: {
        title: event.title,
        type: event.type,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        attendanceMode: event.attendanceMode,
        needsScale: event.needsScale,
        preacherId: event.preacherId,
        theme: event.theme,
        notes: event.notes,
        deletedAt: event.deletedAt ?? null,
        deletedById: event.deletedById ?? null,
        deleteReason: event.deleteReason ?? null,
        updatedAt: event.updatedAt,
      },
    });
  }

  async markAsFinishedIfScheduled(input: MarkAsFinishedInput): Promise<boolean> {
    const result = await this.db.event.updateMany({
      where: { id: input.id, endsAt: null, deletedAt: null },
      data: { endsAt: input.endsAt, status: "FINISHED" },
    });
    return result.count === 1;
  }

  async markAsCancelledIfScheduled(input: MarkAsCancelledInput): Promise<boolean> {
    const result = await this.db.event.updateMany({
      where: { id: input.id, status: "SCHEDULED", deletedAt: null },
      data: { status: "CANCELLED", cancelledAt: input.cancelledAt, cancelledById: input.cancelledById, cancelReason: input.cancelReason },
    });
    return result.count === 1;
  }

  async softDelete(id: string, deletedById: string, reason?: string): Promise<void> {
    await this.db.event.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById, deleteReason: reason ?? null },
    });
  }

  async findAssignment(
    eventId: string, memberId: string, ministryId: string,
  ): Promise<{ id: string } | null> {
    return this.db.eventAssignment.findUnique({
      where: { eventId_memberId_ministryId: { eventId, memberId, ministryId } },
      select: { id: true },
    });
  }

  async findMemberAttendance(
    eventId: string, memberId: string,
  ): Promise<{ eventId: string; memberId: string } | null> {
    return this.db.eventMember.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
      select: { eventId: true, memberId: true },
    });
  }

  async saveWithAttendanceAndFinancial(
    event: Event,
    attendance?: EventAttendance,
    financialRecords?: FinancialRecord[],
  ): Promise<void> {
    await this.db.event.update({
      where: { id: event.id },
      data: {
        title: event.title,
        type: event.type,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        attendanceMode: event.attendanceMode,
        needsScale: event.needsScale,
        preacherId: event.preacherId,
        theme: event.theme,
        notes: event.notes,
        updatedAt: new Date(),
      },
    });

    if (attendance) {
      await this.db.eventAttendance.upsert({
        where: { eventId: event.id },
        update: {
          membersCount: attendance.membersCount,
          visitorsCount: attendance.visitorsCount,
          updatedAt: new Date(),
        },
        create: {
          id: generateId(),
          eventId: event.id,
          membersCount: attendance.membersCount,
          visitorsCount: attendance.visitorsCount,
        },
      });
    }

    for (const fr of financialRecords ?? []) {
      await this.db.financialRecord.create({
        data: {
          id: fr.id,
          amount: fr.amount,
          method: fr.method,
          date: fr.date,
          direction: fr.direction,
          status: fr.status,
          description: fr.description,
          categoryId: fr.categoryId,
          memberId: fr.memberId,
          eventId: event.id,
          recordedById: fr.recordedById,
          reversalOfId: fr.reversalOfId ?? null,
          createdAt: fr.createdAt,
          updatedAt: fr.updatedAt,
        },
      });
    }
  }

  async countEventRelations(eventId: string): Promise<EventRelationCounts> {
    const [memberCount, assignmentCount, attendanceCount, financialCount] = await Promise.all([
      this.db.eventMember.count({ where: { eventId } }),
      this.db.eventAssignment.count({ where: { eventId } }),
      this.db.eventAttendance.count({ where: { eventId } }),
      this.db.financialRecord.count({ where: { eventId } }),
    ]);
    return { memberCount, assignmentCount, attendanceCount, financialCount };
  }

  async assignMember(eventId: string, memberId: string): Promise<void> {
    await this.db.eventMember.create({
      data: { eventId, memberId, joinedAt: new Date() },
    });
  }

  async assignAssignment(
    eventId: string,
    memberId: string,
    ministryId: string,
  ): Promise<void> {
    await this.db.eventAssignment.create({
      data: { id: generateId(), eventId, memberId, ministryId, assignedAt: new Date() },
    });
  }

  async removeMember(eventId: string, memberId: string): Promise<void> {
    await this.db.eventMember.deleteMany({
      where: { eventId, memberId },
    });
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    await this.db.eventAssignment.deleteMany({
      where: { id: assignmentId },
    });
  }
}
