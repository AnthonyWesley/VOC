import {
  AttendanceMode,
  EventAttendance,
  EventType,
  Prisma,
  PrismaClient,
  TransactionDirection,
} from "@prisma/client";
import { Event } from "../entities/Event";
import { IEventRepository } from "./IEventRepository";
import { DetailedEventDTO } from "../../usecases/GetEventDetailedUseCase";
import { ListEventsInput } from "../../usecases/ListEventsUseCase";

export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findDetailedEvent(id: string): Promise<DetailedEventDTO | null> {
    const data = await this.prisma.event.findUnique({
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
    const data = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!data) return null;

    return Event.rehydrate({
      id: data.id,
      title: data.title,
      type: data.type,
      startsAt: data.startsAt,
      preacherId: data.preacherId,
      attendanceMode: data.attendanceMode,
      needsScale: data.needsScale,
      theme: data.theme,
      notes: data.notes,
      createdById: data.createdById ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }

  private buildMonthRange(year?: number, month?: number) {
    const y = year ?? new Date().getFullYear();
    const m = month ?? new Date().getMonth() + 1;

    if (m < 1 || m > 12) {
      throw new Error("Invalid month");
    }

    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));

    return { gte: start, lt: end };
  }

  async getMonthlyReport(params: {
    month: number;
    year: number;
    type?: EventType | null;
  }): Promise<{
    month: number;
    year: number;
    events: Array<{
      id: string;
      title: string | null;
      type: EventType;
      startsAt: Date;
      preacherName: string | null;
      membersCount: number;
      visitorsCount: number;
      assignmentsCount: number;
      attendanceMode: string;
    }>;
    summary: {
      totalEvents: number;
      totalMembers: number;
      totalVisitors: number;
      averageMembers: number;
    };
  }> {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      startsAt: this.buildMonthRange(params.year, params.month),
    };

    if (params.type) {
      where.type = params.type;
    }

    const data = await this.prisma.event.findMany({
      where,
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        startsAt: true,
        attendanceMode: true,
        attendance: {
          select: {
            membersCount: true,
            visitorsCount: true,
          },
        },
        preacher: {
          select: {
            fullName: true,
          },
        },
        members: {
          select: {
            member: {
              select: {
                churchJoinDate: true,
              },
            },
          },
        },
        assignments: {
          select: {
            id: true,
          },
        },
      },
    });

    const events = data.map((item) => {
      const membersCount =
        item.attendanceMode === "INDIVIDUAL"
          ? item.members.filter(
              (member) => member.member.churchJoinDate <= item.startsAt,
            ).length
          : item.attendance?.membersCount ?? 0;

      const visitorsCount =
        item.attendanceMode === "INDIVIDUAL"
          ? item.members.filter(
              (member) => member.member.churchJoinDate > item.startsAt,
            ).length
          : item.attendance?.visitorsCount ?? 0;

      return {
        id: item.id,
        title: item.title,
        type: item.type,
        startsAt: item.startsAt,
        preacherName: item.preacher?.fullName ?? null,
        membersCount,
        visitorsCount,
        assignmentsCount: item.assignments.length,
        attendanceMode: item.attendanceMode,
      };
    });

    const totalMembers = events.reduce(
      (sum, event) => sum + event.membersCount,
      0,
    );
    const totalVisitors = events.reduce(
      (sum, event) => sum + event.visitorsCount,
      0,
    );

    return {
      month: params.month,
      year: params.year,
      events,
      summary: {
        totalEvents: events.length,
        totalMembers,
        totalVisitors,
        averageMembers: events.length
          ? Number((totalMembers / events.length).toFixed(2))
          : 0,
      },
    };
  }

  async findAll(params: ListEventsInput): Promise<{
    events: Event[];
    nextCursor: string | null;
  }> {
    const { limit, cursor, type, month, year } = params;

    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      startsAt: this.buildMonthRange(year, month),
    };

    if (type) where.type = type;

    const data = await this.prisma.event.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { startsAt: "desc" },
    });

    let nextCursor: string | null = null;

    if (data.length > limit) {
      const nextItem = data.pop();
      nextCursor = nextItem!.id;
    }

    const events = data.map((item) =>
      Event.rehydrate({
        id: item.id,
        title: item.title,
        type: item.type,
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
        deletedAt: item.deletedAt,
      }),
    );

    return { events, nextCursor };
  }

  async save(event: Event): Promise<void> {
    await this.prisma.event.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        type: event.type,
        startsAt: event.startsAt,
        attendanceMode: event.attendanceMode,
        needsScale: event.needsScale,
        preacherId: event.preacherId,
        theme: event.theme,
        notes: event.notes,
        updatedAt: new Date(),
      },
      create: {
        id: event.id,
        title: event.title,
        attendanceMode: event.attendanceMode,
        type: event.type,
        startsAt: event.startsAt,
        needsScale: event.needsScale,
        preacherId: event.preacherId,
        theme: event.theme,
        notes: event.notes,
        createdById: event.createdById ?? null,
      },
    });
  }

  async saveWithAttendanceAndFinancial(
    event: Event,
    attendance?: EventAttendance,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Upsert do evento
      await tx.event.upsert({
        where: { id: event.id },
        update: {
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
        create: {
          id: event.id,
          title: event.title,
          type: event.type,
          attendanceMode: event.attendanceMode,
          needsScale: event.needsScale,
          startsAt: event.startsAt,
          preacherId: event.preacherId,
          theme: event.theme,
          notes: event.notes,
          createdById: event.createdById ?? null,
        },
      });

      // 2️⃣ Upsert da attendance, se fornecida
      if (attendance) {
        await tx.eventAttendance.upsert({
          where: { eventId: event.id },
          update: {
            membersCount: attendance.membersCount,
            visitorsCount: attendance.visitorsCount,
            updatedAt: new Date(),
          },
          create: {
            eventId: event.id,
            membersCount: attendance.membersCount,
            visitorsCount: attendance.visitorsCount,
          },
        });
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignMember(eventId: string, memberId: string): Promise<void> {
    await this.prisma.eventMember.create({
      data: { eventId, memberId, joinedAt: new Date() },
    });
  }

  async assignAssignment(
    eventId: string,
    memberId: string,
    ministryId: string,
  ): Promise<void> {
    await this.prisma.eventAssignment.create({
      data: {
        eventId,
        memberId,
        ministryId,
        assignedAt: new Date(),
      },
    });
  }

  async removeMember(eventId: string, memberId: string): Promise<void> {
    await this.prisma.eventMember.delete({
      where: {
        eventId_memberId: {
          eventId,
          memberId,
        },
      },
    });
  }
  async removeAssignment(assignmentId: string): Promise<void> {
    await this.prisma.eventAssignment.deleteMany({
      where: {
        id: assignmentId,
      },
    });
  }
}
