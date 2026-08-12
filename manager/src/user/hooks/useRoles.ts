import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { roleService } from "../services/roleService";

export default function useRoles() {
  const { isAuthenticated } = useAuthStatus();

  const queryRoles = useQuery({
    queryKey: ["rolesData"],
    queryFn: () => roleService.list(),
    enabled: isAuthenticated,
  });

  return { queryRoles };
}
