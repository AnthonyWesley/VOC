import { EventType } from "@prisma/client";

export type GetMonthlyReportInput = {
  month: number;
  year: number;
  type?: EventType;
  timezone: string;
};

export type MonthlyEventReport = {
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
    averageMembers: number | null;
  };
  individual: {
    events: number;
    membersPresent: number;
    visitorsPresent: number;
    averageMembersPresent: number | null;
    averageVisitorsPresent: number | null;
  };
  cancelledEvents: number;
};

export interface IEventReportRepository {
  getMonthlyReport(input: GetMonthlyReportInput): Promise<MonthlyEventReport>;
}
