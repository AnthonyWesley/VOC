import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { ministriesService } from "../services/ministriesService";

export default function useMinistries() {
  const { isAuthenticated } = useAuthStatus();

  const queryMinistries = useQuery({
    queryKey: ["ministriesData"],
    queryFn: () => ministriesService.list(),
    enabled: isAuthenticated,
  });

  return { queryMinistries };
}
