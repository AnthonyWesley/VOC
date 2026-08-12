import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { memberService } from "../services/memberService";

export default function useMember(memberId?: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryMember = useQuery({
    queryKey: ["memberData", memberId],
    queryFn: () => memberService.find(memberId),
    enabled: !!memberId && isAuthenticated,
  });

  return { queryMember };
}
