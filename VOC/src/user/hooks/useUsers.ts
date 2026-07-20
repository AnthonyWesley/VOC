// src/hooks/useUsers.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { userService } from "../services/userService";
import { PaginatedUsersOutput } from "../types/userTypes";

export default function useUsers(filters?: {
  search?: string;
  isActive?: boolean;
}) {
  const { isAuthenticated } = useAuthStatus();

  const queryUsers = useInfiniteQuery<PaginatedUsersOutput, Error>({
    queryKey: ["usersData", filters?.search, filters?.isActive],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      userService.list({
        limit: 20,
        cursor: pageParam as any,
        ...filters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });

  return { queryUsers };
}
