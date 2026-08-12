import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { notificationService } from "../services/notificationService";

export function useUnreadCount() {
  const { isAuthenticated } = useAuthStatus();

  return useQuery({
    queryKey: ["notificationUnreadCount"],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count } = await notificationService.unreadCount();
      return count;
    },
  });
}
