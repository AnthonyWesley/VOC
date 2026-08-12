import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { dashboardService } from "../services/dashboardService";
import { LEVEL } from "../../shared/constants/levels";

export default function useDashboard() {
  const { isAuthenticated, authLevel } = useAuthStatus();
  const isLevelAuthorized = authLevel >= LEVEL.PRESIDENT;

  const queryDashboard = useQuery({
    queryKey: ["dashboardData"],
    queryFn: dashboardService.get,
    enabled: isAuthenticated && isLevelAuthorized,
  });

  return { queryDashboard };
}
