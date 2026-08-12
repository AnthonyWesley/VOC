import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { userService } from "../services/userService";

export default function useUser(userId?: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryUser = useQuery({
    queryKey: ["userData", userId],
    queryFn: () => userService.find(userId),
    enabled: !!userId && isAuthenticated,
  });

  return { queryUser };
}
