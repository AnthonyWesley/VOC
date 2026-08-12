import { useInfiniteQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { eventService } from "../services/eventService";
import { EventType, PaginatedEventsOutput } from "../types/eventTypes";

export default function useEvents(filters?: {
  type?: EventType;
  month: number;
  year: number;
}) {
  const { isAuthenticated } = useAuthStatus();
  const safeFilters = filters ?? {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };

  return useInfiniteQuery<PaginatedEventsOutput, Error>({
    queryKey: [
      "events",
      safeFilters.type ?? null,
      safeFilters.month,
      safeFilters.year,
    ],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      eventService.list({
        limit: 20,
        cursor:
          typeof pageParam === "string" || pageParam == null
            ? pageParam ?? undefined
            : undefined,
        ...safeFilters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });
}
