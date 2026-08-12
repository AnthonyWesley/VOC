import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { financialRecordsService } from "../services/financialRecordsService";

export default function useFinancialRecord(recordId?: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryRecord = useQuery({
    queryKey: ["financialRecord", recordId],
    queryFn: () => financialRecordsService.find(recordId),
    enabled: !!recordId && isAuthenticated,
  });

  return { queryRecord };
}
