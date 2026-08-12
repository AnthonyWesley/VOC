import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { financialRecordsService } from "../services/financialRecordsService";

export default function useFinancialRecords(includeCancelled?: boolean) {
  const { isAuthenticated } = useAuthStatus();

  const queryFinancialRecords = useQuery({
    queryKey: ["financialRecords", { includeCancelled }],
    queryFn: () => financialRecordsService.list(includeCancelled),
    enabled: isAuthenticated,
  });

  return { queryFinancialRecords };
}
