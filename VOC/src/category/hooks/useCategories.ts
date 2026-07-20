import { useInfiniteQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import {
  categoriesService,
  PaginatedCategoriesResponse,
} from "../services/categoriesService";

export default function useCategories(filters?: {
  search?: string;
  type?: "INCOME" | "EXPENSE";
}) {
  const { isAuthenticated } = useAuthStatus();

  const queryCategories = useInfiniteQuery<PaginatedCategoriesResponse, Error>({
    queryKey: ["categoriesData", filters?.search ?? "", filters?.type ?? null],

    initialPageParam: undefined,

    queryFn: ({ pageParam }) =>
      categoriesService.list({
        limit: 20,
        cursor: pageParam as any,
        ...filters,
      }),

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    enabled: isAuthenticated,
  });

  return { queryCategories };
}
