import churchApi from "../../api/axios";
import { EventType } from "../types/eventTypes";

export type MonthlyEventReportItem = {
  id: string;
  title: string | null;
  type: EventType;
  startsAt: string;
  preacherName: string | null;
  membersCount: number;
  visitorsCount: number;
  assignmentsCount: number;
  attendanceMode: string;
};

export type MonthlyEventReportOutput = {
  month: number;
  year: number;
  events: MonthlyEventReportItem[];
  summary: {
    totalEvents: number;
    totalMembers: number;
    totalVisitors: number;
    averageMembers: number;
  };
};

export const eventReportService = {
  getMonthly: async (params: {
    month: number;
    year: number;
    type?: EventType | "";
  }): Promise<MonthlyEventReportOutput> => {
    const response = await churchApi.get("/events/monthly-report", {
      params,
    });

    return response.data;
  },
};
