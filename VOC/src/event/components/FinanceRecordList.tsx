import { Icon } from "@iconify/react/dist/iconify.js";
import { Balloon } from "../../components/Balloon";
import { FinancialRecordDTO } from "../../finance/services/financialRecordsService";
import Modal from "../../components/Modal";
import FinancialRecordForm from "../../finance/components/FinancialRecordForm";
import { useNavigate } from "react-router-dom";
import { LEVEL } from "../../shared/constants/levels";

type Props = {
  records: FinancialRecordDTO[];
  eventId: string;
};

export default function FinanceRecordList({ records, eventId }: Props) {
  const navigate = useNavigate();

  return (
    <Balloon offset={40}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Movimentações</h2>

        <Modal
          id="createRecordToEventModal"
          icon="ic:baseline-plus"
          info="Adicionar registro"
          scale={1}
          minLevel={LEVEL.MINISTRY_LEADER}
        >
          <FinancialRecordForm eventId={eventId} />
        </Modal>
      </div>

      {/* LISTA */}
      {records.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">
          Nenhum registro financeiro.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {records.map((fr) => {
            const isIncome = fr.direction === "INCOME";

            return (
              <li
                key={fr.id}
                onClick={() => navigate(`/app/financial-records/${fr.id}`)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/5"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg bg-slate-800 ${
                      isIncome ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    <Icon
                      icon={isIncome ? "mdi:trending-up" : "mdi:trending-down"}
                      width={20}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {fr.category?.name}
                    </span>

                    <span className="text-xs text-gray-400">
                      {fr.member?.fullName ?? "—"}
                    </span>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end">
                  <span
                    className={`font-mono text-sm ${
                      isIncome ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isIncome ? "+ " : "- "}
                    {fr.amount.toFixed(2)}
                  </span>

                  <span className="mt-1 text-[10px] text-gray-500 uppercase">
                    {fr.method.replace("_", " ")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Balloon>
  );
}
