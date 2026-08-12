import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { Balloon } from "../../components/Balloon";
import { currencyFormatter } from "../../helpers/currencyFormatter";
import { downloadPdf } from "../../pdf/download";
import EventReportPdf from "../../pdf/documents/EventReport";
import type { EventReportPdfData } from "../../pdf/types";
import { downloadExcelReport } from "../../helpers/reportExport";
import useFinancialRecordFromEvent from "../../finance/hooks/useFinancialRecordFromEvent";
import { DetailedEventDTO } from "../types/eventTypes";
import Spin from "../../components/Spin";

type Props = {
  event: DetailedEventDTO;
  eventId: string;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  HOUSE_SERVICE: "Culto em Casa",
  SUNDAY_SERVICE: "Culto de Domingo",
  PRAYER_MEETING: "Reunião de Oração",
  BIBLE_STUDY: "Estudo Bíblico",
  YOUTH_NIGHT: "Noite da Juventude",
  SPECIAL_EVENT: "Evento Especial",
};

export default function EventReportTab({ event, eventId }: Props) {
  const {
    queryRecordsFromEvent: { data: financialData, isLoading: finLoading },
  } = useFinancialRecordFromEvent(eventId);

  const assignmentsByMinistry = useMemo(() => {
    if (!event.assignments) return {};
    return event.assignments.reduce<Record<string, typeof event.assignments>>(
      (acc, a) => {
        if (!acc[a.ministry.id]) acc[a.ministry.id] = [];
        acc[a.ministry.id].push(a);
        return acc;
      },
      {},
    );
  }, [event.assignments]);

  const startDate = new Date(event.startsAt).toLocaleString("pt-BR");
  const endDate = event.endsAt
    ? new Date(event.endsAt).toLocaleString("pt-BR")
    : null;

  const exportRows = useMemo(() => {
    const rows: Array<Record<string, string | number>> = [];

    // 1. SUMMARY
    rows.push({ Seção: "RESUMO", Item: "Título", Detalhe: event.title ?? "-" });
    rows.push({ Seção: "RESUMO", Item: "Tipo", Detalhe: EVENT_TYPE_LABELS[event.type] ?? event.type });
    rows.push({ Seção: "RESUMO", Item: "Início", Detalhe: startDate });
    rows.push({ Seção: "RESUMO", Item: "Fim", Detalhe: endDate ?? "-" });
    rows.push({ Seção: "RESUMO", Item: "Tema", Detalhe: event.theme ?? "-" });
    rows.push({ Seção: "RESUMO", Item: "Observações", Detalhe: event.notes ?? "-" });
    rows.push({ Seção: "RESUMO", Item: "Preletor", Detalhe: event.preacher?.fullName ?? "-" });
    rows.push({ Seção: "RESUMO", Item: "Membros presentes", Detalhe: event.attendance?.membersCount ?? 0 });
    rows.push({ Seção: "RESUMO", Item: "Visitantes", Detalhe: event.attendance?.visitorsCount ?? 0 });

    if (financialData?.financialSummary) {
      rows.push({ Seção: "RESUMO", Item: "Total entradas (R$)", Detalhe: financialData.financialSummary.income.toFixed(2) });
      rows.push({ Seção: "RESUMO", Item: "Total saídas (R$)", Detalhe: financialData.financialSummary.expense.toFixed(2) });
      rows.push({ Seção: "RESUMO", Item: "Saldo (R$)", Detalhe: financialData.financialSummary.balance.toFixed(2) });
    }

    // 2. MEMBERS
    if (event.members && event.members.length > 0) {
      rows.push({ Seção: "MEMBROS PRESENTES", Item: "Nome", Detalhe: "" });
      event.members.forEach((m) => {
        rows.push({ Seção: "", Item: m.fullName, Detalhe: "" });
      });
    }

    // 3. ASSIGNMENTS
    if (event.assignments && event.assignments.length > 0) {
      rows.push({ Seção: "ESCALA", Item: "Membro", Detalhe: "Ministério / Descrição" });
      event.assignments.forEach((a) => {
        rows.push({
          Seção: "",
          Item: a.member.fullName,
          Detalhe: `${a.ministry.name}${a.description ? ` — ${a.description}` : ""}`,
        });
      });
    }

    // 4. FINANCIAL RECORDS
    if (financialData?.financialRecords && financialData.financialRecords.length > 0) {
      rows.push({ Seção: "MOVIMENTAÇÕES", Item: "Categoria", Detalhe: "Valor" });
      financialData.financialRecords.forEach((fr: any) => {
        rows.push({
          Seção: "",
          Item: `${fr.category?.name ?? "Sem categoria"} (${fr.direction === "INCOME" ? "+" : "-"})`,
          Detalhe: `R$ ${fr.amount.toFixed(2)} — ${fr.method.replace("_", " ")}`,
        });
      });
    }

    return rows;
  }, [event, startDate, endDate, financialData]);

  return (
    <div className="space-y-6 pt-2">
      {/* EXPORT BUTTONS */}
      <div className="flex gap-3">
        <button
          onClick={() =>
            downloadExcelReport(
              `relatorio-evento-${event.id?.slice(0, 8)}`,
              [
                { label: "Seção", key: "Seção" },
                { label: "Item", key: "Item" },
                { label: "Detalhe", key: "Detalhe" },
              ],
              exportRows,
            )
          }
          className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400 transition-colors hover:bg-cyan-500/30"
        >
          Exportar Excel
        </button>
        <button
          onClick={() => {
            const data: EventReportPdfData = {
              organization: { name: "VOC Church", document: "" },
              event: {
                id: event.id,
                title: event.title ?? undefined,
                type: event.type,
                startsAt: new Date(event.startsAt),
                endsAt: event.endsAt ? new Date(event.endsAt) : undefined,
                theme: event.theme ?? undefined,
                notes: event.notes ?? undefined,
                preacherName: event.preacher?.fullName ?? undefined,
                membersCount: event.attendance?.membersCount ?? 0,
                visitorsCount: event.attendance?.visitorsCount ?? 0,
                members: event.members?.map((m) => ({ name: m.fullName })),
                assignments: event.assignments?.map((a) => ({
                  memberName: a.member.fullName,
                  ministry: a.ministry.name,
                  description: a.description ?? undefined,
                })),
                financialRecords: financialData?.financialRecords?.map((fr: any) => ({
                  category: fr.category?.name ?? "Sem categoria",
                  direction: fr.direction,
                  amount: fr.amount,
                  method: fr.method,
                  recordedBy: fr.recordedBy?.fullName ?? fr.recordedBy?.email ?? undefined,
                  recordedByRole: fr.recordedBy?.roleName ?? undefined,
                })),
                financialSummary: financialData?.financialSummary ?? undefined,
              },
              audit: {
                documentId: event.id.slice(0, 8).toUpperCase(),
                createdAt: new Date(event.createdAt),
                generatedAt: new Date(),
                createdBy: event.createdBy?.fullName ?? event.createdBy?.email ?? undefined,
                createdByRole: event.createdBy?.roleName ?? undefined,
              },
            };
            downloadPdf(
              <EventReportPdf data={data} />,
              `relatorio-evento-${event.id?.slice(0, 8)}`,
            );
          }}
          className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-400 transition-colors hover:bg-purple-500/30"
        >
          Exportar PDF
        </button>
      </div>

      {/* INFORMAÇÕES GERAIS */}
      <Balloon offset={40}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Icon icon="mdi:information-outline" className="text-cyan-400" />
          Informações gerais
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Título</p>
            <p className="text-[var(--text-primary)]">{event.title ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-400">Tipo</p>
            <p className="text-[var(--text-primary)]">
              {EVENT_TYPE_LABELS[event.type] ?? event.type}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Início</p>
            <p className="text-[var(--text-primary)]">{startDate}</p>
          </div>
          <div>
            <p className="text-gray-400">Fim</p>
            <p className="text-[var(--text-primary)]">{endDate ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400">Tema</p>
            <p className="text-[var(--text-primary)]">{event.theme ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400">Observações</p>
            <p className="text-[var(--text-primary)]">{event.notes ?? "—"}</p>
          </div>
          {event.createdBy && (
            <div className="col-span-2">
              <p className="text-gray-400">Criado por</p>
              <p className="text-[var(--text-primary)]">
                {event.createdBy.fullName ?? event.createdBy.email}
                {event.createdBy.roleName && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({event.createdBy.roleName})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </Balloon>

      {/* PRELETOR */}
      <Balloon offset={40}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Icon icon="mdi:microphone" className="text-cyan-400" />
          Preletor
        </h2>
        {event.preacher ? (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-700 text-sm text-[var(--text-primary)]">
              {event.preacher.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {event.preacher.fullName}
              </p>
              {event.preacher.email && (
                <p className="text-xs text-gray-400">
                  {event.preacher.email}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nenhum preletor definido.</p>
        )}
      </Balloon>

      {/* PRESENÇA */}
      <Balloon offset={40}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Icon icon="mdi:account-check" className="text-cyan-400" />
          Presença
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Membros
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {event.attendance?.membersCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-xs font-bold tracking-wider text-blue-400 uppercase">
              Visitantes
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-400">
              {event.attendance?.visitorsCount ?? 0}
            </p>
          </div>
        </div>

        {event.members && event.members.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-300">
              Membros presentes ({event.members.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {event.members.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-gray-300"
                >
                  {m.fullName}
                </span>
              ))}
            </div>
          </div>
        )}
      </Balloon>

      {/* ESCALA */}
      <Balloon offset={40}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Icon icon="mdi:clipboard-list-outline" className="text-cyan-400" />
          Escala por ministério
        </h2>
        {Object.keys(assignmentsByMinistry).length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma escala registrada.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(assignmentsByMinistry).map(
              ([ministryId, members]) => (
                <div key={ministryId}>
                  <p className="mb-2 text-sm font-semibold text-indigo-300">
                    {members[0].ministry.name}
                  </p>
                  <ul className="space-y-1">
                    {members.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <Icon
                          icon="mdi:account"
                          className="shrink-0 text-gray-500"
                          width={14}
                        />
                        {a.member.fullName}
                        {a.description && (
                          <span className="text-xs text-gray-500">
                            — {a.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        )}
      </Balloon>

      {/* FINANCEIRO */}
      <Balloon offset={40}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Icon icon="mdi:cash-multiple" className="text-cyan-400" />
          Financeiro
        </h2>
        {finLoading ? (
          <Spin />
        ) : financialData?.financialSummary ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                  Entradas
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  {currencyFormatter.format(
                    financialData.financialSummary.income,
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-xs font-bold tracking-wider text-red-400 uppercase">
                  Saídas
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-red-400">
                  {currencyFormatter.format(
                    financialData.financialSummary.expense,
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Saldo
                </p>
                <p
                  className={`mt-1 font-mono text-lg font-bold ${
                    (financialData.financialSummary.balance ?? 0) >= 0
                      ? "text-[var(--text-primary)]"
                      : "text-orange-400"
                  }`}
                >
                  {currencyFormatter.format(
                    financialData.financialSummary.balance,
                  )}
                </p>
              </div>
            </div>

            {financialData.financialRecords.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-300">
                  Movimentações
                </p>
                <ul className="space-y-2">
                  {financialData.financialRecords.map((fr: any) => (
                    <li
                      key={fr.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/30 px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">
                          {fr.category?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {fr.method.replace("_", " ")}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-sm ${
                          fr.direction === "INCOME"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {fr.direction === "INCOME" ? "+" : "-"}
                        {fr.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Nenhum registro financeiro para este evento.
          </p>
        )}
      </Balloon>
    </div>
  );
}
