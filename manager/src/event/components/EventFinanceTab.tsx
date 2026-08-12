import FinanceRecordList from "./FinanceRecordList";
import FinanceSummary from "./FinanceSummary";
import useFinancialRecordFromEvent from "../../finance/hooks/useFinancialRecordFromEvent";
import Spin from "../../components/Spin";

type Props = {
  eventId: string;
};

export default function EventFinanceTab({ eventId }: Props) {
  const {
    queryRecordsFromEvent: { data: financialData, isLoading },
  } = useFinancialRecordFromEvent(eventId);

  if (isLoading) {
    return <Spin />;
  }
  1;
  const { financialSummary, financialRecords } = financialData;
  return (
    <div className="space-y-6 pt-2">
      <FinanceSummary
        income={financialSummary?.income}
        expense={financialSummary?.expense}
        balance={financialSummary?.balance}
      />

      <FinanceRecordList records={financialRecords} eventId={eventId} />
    </div>
  );
}
