import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { ministriesService } from "../services/ministriesService";

export default function useMinistry(ministryId: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryMinistry = useQuery({
    queryKey: ["ministryData"],
    queryFn: () => ministriesService.find(ministryId),
    enabled: isAuthenticated,
  });

  return { queryMinistry };
}
