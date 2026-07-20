import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { financialRecordsService } from "../services/financialRecordsService";

export default function useFinancialRecordFromEvent(eventId?: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryRecordsFromEvent = useQuery({
    queryKey: ["financialRecordEventData", eventId],
    queryFn: () => financialRecordsService.fidByEvent(eventId),
    enabled: !!eventId && isAuthenticated,
  });

  return { queryRecordsFromEvent };
}
