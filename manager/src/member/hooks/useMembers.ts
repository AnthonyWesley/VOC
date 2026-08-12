import { useInfiniteQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { memberService } from "../services/memberService";
import { ListModeType, PaginatedMembersResponse } from "../types/memberTypes";

export default function useMembers(filters: {
  mode: ListModeType;
  eventId?: string;
  ministryId?: string;
  status?: string;
  search?: string;
}) {
  const { isAuthenticated } = useAuthStatus();

  const queryMembers = useInfiniteQuery<PaginatedMembersResponse, Error>({
    queryKey: [
      "membersData",
      filters.mode,
      filters.eventId ?? null,
      filters.ministryId ?? null,
      filters.status ?? null,
      filters.search ?? "",
    ],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      memberService.list({
        limit: 20,
        cursor: pageParam as any,
        ...filters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });

  return { queryMembers };
}
