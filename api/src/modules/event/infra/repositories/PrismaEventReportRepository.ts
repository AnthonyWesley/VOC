import { PrismaClient, Prisma, EventType } from "@prisma/client";
import { IEventReportRepository, GetMonthlyReportInput, MonthlyEventReport } from "../../domain/repositories/IEventReportRepository";
import { buildMonthRangeUtc } from "../../domain/utils/zonedDateTime";

// SQLite (dev) só suporta "Serializable"; Postgres suporta "RepeatableRead".
function getRepeatableReadIsolation(): Prisma.TransactionIsolationLevel | undefined {
  const levels = Prisma.TransactionIsolationLevel as Record<string, string>;
  return (levels.RepeatableRead as Prisma.TransactionIsolationLevel) ?? undefined;
}

export class PrismaEventReportRepository implements IEventReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMonthlyReport(params: GetMonthlyReportInput): Promise<MonthlyEventReport> {
    const range = buildMonthRangeUtc(params.timezone, params.year, params.month);
    const where: Prisma.EventWhereInput = { deletedAt: null, startsAt: range };

    if (params.type) where.type = params.type;

    const result = await this.prisma.$transaction(
      async (tx) => {
        const data = await tx.event.findMany({
          where: { ...where, status: { not: "CANCELLED" } },
          orderBy: [{ startsAt: "desc" }, { id: "desc" }],
          select: {
            id: true, title: true, type: true, startsAt: true,
            status: true, attendanceMode: true,
            attendance: { select: { membersCount: true, visitorsCount: true } },
            preacher: { select: { fullName: true } },
            members: { select: { participantType: true } },
            assignments: { select: { id: true } },
          },
        });

        const cancelledCount = await tx.event.count({
          where: { ...where, status: "CANCELLED" },
        });

        return { data, cancelledCount };
      },
      { isolationLevel: getRepeatableReadIsolation() },
    );

    const { data, cancelledCount } = result;

    const summaryEvents = data.filter((e) => e.attendanceMode === "SUMMARY");
    const individualEvents = data.filter((e) => e.attendanceMode === "INDIVIDUAL");

    const calcSummary = (events: typeof summaryEvents) => ({
      membersCount: events.reduce((s, e) => s + (e.attendance?.membersCount ?? 0), 0),
      visitorsCount: events.reduce((s, e) => s + (e.attendance?.visitorsCount ?? 0), 0),
    });

    const calcIndividual = (events: typeof individualEvents) => ({
      membersPresent: events.reduce((s, e) => s + e.members.filter((m) => m.participantType === "MEMBER").length, 0),
      visitorsPresent: events.reduce((s, e) => s + e.members.filter((m) => m.participantType === "VISITOR").length, 0),
    });

    const s = calcSummary(summaryEvents);
    const ind = calcIndividual(individualEvents);

    function averageOrNull(total: number, eventCount: number): number | null {
      return eventCount === 0 ? null : Number((total / eventCount).toFixed(2));
    }

    const eventList = data.map((item) => {
      let membersCount = 0, visitorsCount = 0;
      if (item.attendanceMode === "INDIVIDUAL") {
        membersCount = item.members.filter((m) => m.participantType === "MEMBER").length;
        visitorsCount = item.members.filter((m) => m.participantType === "VISITOR").length;
      } else {
        membersCount = item.attendance?.membersCount ?? 0;
        visitorsCount = item.attendance?.visitorsCount ?? 0;
      }
      return {
        id: item.id, title: item.title, type: item.type,
        startsAt: item.startsAt, preacherName: item.preacher?.fullName ?? null,
        membersCount, visitorsCount, assignmentsCount: item.assignments.length,
        attendanceMode: item.attendanceMode,
      };
    });

    return {
      month: params.month, year: params.year, events: eventList,
      summary: {
        totalEvents: summaryEvents.length,
        totalMembers: s.membersCount,
        totalVisitors: s.visitorsCount,
        averageMembers: averageOrNull(s.membersCount, summaryEvents.length),
      },
      individual: {
        events: individualEvents.length,
        membersPresent: ind.membersPresent,
        visitorsPresent: ind.visitorsPresent,
        averageMembersPresent: averageOrNull(ind.membersPresent, individualEvents.length),
        averageVisitorsPresent: averageOrNull(ind.visitorsPresent, individualEvents.length),
      },
      cancelledEvents: cancelledCount,
    };
  }
}
