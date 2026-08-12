import useAuthStatus from "../../auth/hooks/useAuthStatus";

import { useInfiniteQuery } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";

import { NotificationDTO } from "../types/NotificationDTO";

export type PaginatedNotifications = {
  items: NotificationDTO[];
  totalCount: number;
};

export function useNotifications() {
  const { isAuthenticated } = useAuthStatus();

  const query = useInfiniteQuery({
    queryKey: ["notificationsData"],
    enabled: isAuthenticated,

    queryFn: async ({ pageParam }) => {
      return notificationService.getNotification({
        offset: pageParam,
        limit: 10,
      });
    },

    initialPageParam: 0,

    getNextPageParam: (lastPage, pages) => {
      const loadedItems = pages.flatMap((p) => p.items ?? []).length;

      return loadedItems < lastPage.totalCount ? loadedItems : undefined;
    },
  });

  return { queryNotifications: query };
}
