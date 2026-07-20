import { useQuery } from "@tanstack/react-query";
import { eventReportService } from "../services/eventReportService";
import { EventType } from "../types/eventTypes";

export function useMonthlyEventReport(filters: {
  month: number;
  year: number;
  type?: EventType | "";
}) {
  return useQuery({
    queryKey: ["monthlyEventReport", filters.month, filters.year, filters.type],
    queryFn: () => eventReportService.getMonthly(filters),
  });
}
