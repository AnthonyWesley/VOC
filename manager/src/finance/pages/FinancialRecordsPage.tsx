import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import FinancialRecordForm from "../components/FinancialRecordForm";
import useFinancialRecords from "../hooks/useFinancialRecords";
import { currencyFormatter } from "../../helpers/currencyFormatter";
import { PageHeader } from "../../components/PageHeader";
import { useModalStore } from "../../store/useModalStore";
import { downloadPdf } from "../../pdf/download";
import FinancialReport from "../../pdf/documents/FinancialReport";
import type { FinancialReportPdfData } from "../../pdf/types";
import { downloadExcelReport } from "../../helpers/reportExport";
import { MonthYearFilter } from "../../event/components/MonthFilter";
import { LEVEL } from "../../shared/constants/levels";
import CategoryDoughnutChart from "../components/CategoryDoughnutChart";
import MethodBarChart from "../components/MethodBarChart";

const now = new Date();

export default function FinancialRecordsPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const {
    queryFinancialRecords: { data: records, isLoading, error },
  } = useFinancialRecords(includeCancelled);

  const safeRecords = useMemo(
    () =>
      (records ?? []).filter((record) => {
        const d = new Date(record.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      }),
    [records, month, year],
  );

  const totals = useMemo(() => {
    const t = { income: 0, expense: 0 };
    for (const r of safeRecords) {
      const amt = Number(r.amount);
      if (r.direction === "INCOME") t.income += amt;
      else t.expense += amt;
    }
    return t;
  }, [safeRecords]);

  const balance = totals.income - totals.expense;
  const grandTotal = totals.income + totals.expense;

  const byCategory = useMemo(
    () =>
      Object.values(
        safeRecords.reduce<
          Record<string, { label: string; total: number; direction: string }>
        >((acc, r) => {
          const key = r.category?.id ?? "uncategorized";
          if (!acc[key])
            acc[key] = {
              label: r.category?.name ?? "Sem categoria",
              total: 0,
              direction: r.direction,
            };
          acc[key].total += Number(r.amount);
          return acc;
        }, {}),
      )
        .sort((a, b) => b.total - a.total)
        .map((item) => ({
          ...item,
          pct: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
        })),
    [safeRecords, grandTotal],
  );

  const byMethod = useMemo(
    () =>
      Object.values(
        safeRecords.reduce<Record<string, { label: string; total: number }>>(
          (acc, r) => {
            if (!acc[r.method]) acc[r.method] = { label: r.method, total: 0 };
            acc[r.method].total += Number(r.amount);
            return acc;
          },
          {},
        ),
      )
        .sort((a, b) => b.total - a.total)
        .map((item) => ({
          ...item,
          pct: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
        })),
    [safeRecords, grandTotal],
  );

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const exportRows = useMemo(() => {
    const rows: Array<Record<string, string | number>> = [];

    rows.push({
      Seção: "RESUMO",
      Categoria: "Entradas",
      Valor: currencyFormatter.format(totals.income),
    });
    rows.push({
      Seção: "RESUMO",
      Categoria: "Saídas",
      Valor: currencyFormatter.format(totals.expense),
    });
    rows.push({
      Seção: "RESUMO",
      Categoria: "Saldo",
      Valor: currencyFormatter.format(balance),
    });
    rows.push({
      Seção: "RESUMO",
      Categoria: "Total de transações",
      Valor: safeRecords.length,
    });
    rows.push({ Seção: "", Categoria: "", Valor: "" });

    rows.push({ Seção: "POR CATEGORIA", Categoria: "Nome", Valor: "Total" });
    byCategory.forEach((item) => {
      rows.push({
        Seção: "",
        Categoria: `${item.label} (${item.direction})`,
        Valor: currencyFormatter.format(item.total),
      });
    });

    rows.push({ Seção: "", Categoria: "", Valor: "" });
    rows.push({ Seção: "POR MÉTODO", Categoria: "Método", Valor: "Total" });
    byMethod.forEach((item) => {
      rows.push({
        Seção: "",
        Categoria: item.label.replace("_", " "),
        Valor: currencyFormatter.format(item.total),
      });
    });

    rows.push({ Seção: "", Categoria: "", Valor: "" });
    rows.push({
      Seção: "MOVIMENTAÇÕES",
      Categoria: "Data | Dir. | Método | Descrição",
      Valor: "Valor",
    });

    safeRecords.forEach((r) => {
      rows.push({
        Seção: "",
        Categoria: `${new Date(r.date).toLocaleDateString("pt-BR")} | ${r.direction} | ${r.method} | ${r.description ?? "-"}`,
        Valor: Number(r.amount),
      });
    });

    return rows;
  }, [safeRecords, totals, balance, byCategory, byMethod]);

  if (isLoading)
    return <p className="p-6 text-[var(--text-secondary)]">Carregando...</p>;
  if (error)
    return <p className="p-6 text-[var(--accent-coral)]">Erro ao carregar.</p>;

  return (
    <div className="space-y-6 px-4 pb-5 md:px-6">
      <PageHeader
        icon="mdi:cash-multiple"
        title="Financeiro"
        subtitle="Registros e relatorio mensal"
        className="border-b border-[var(--card-border)] bg-none px-0 py-0 pb-4"
        onNew={() => openModal("createFinancialRecordModal")}
        minLevel={LEVEL.TREASURER}
      />

      {/* FILTRO MÊS/ANO + EXPORT */}
      <section className="grid gap-4 md:grid-cols-4">
        <MonthYearFilter
          month={month}
          year={year}
          onChange={({ month: m, year: y }) => {
            setMonth(m);
            setYear(y);
          }}
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-2 text-xs text-gray-400 transition-colors hover:bg-gray-800/60">
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={(e) => setIncludeCancelled(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          Mostrar cancelados
        </label>
        <button
          onClick={() =>
            downloadExcelReport(
              `relatorio-financeiro-${year}-${String(month).padStart(2, "0")}`,
              [
                { label: "Seção", key: "Seção" },
                { label: "Categoria", key: "Categoria" },
                { label: "Valor", key: "Valor" },
              ],
              exportRows,
            )
          }
          className="rounded-lg bg-[var(--accent-cyan)]/20 px-3 py-1.5 text-xs font-bold text-[var(--accent-cyan)] transition-colors hover:bg-[var(--accent-cyan)]/30"
        >
          Exportar Excel
        </button>
        <button
          onClick={() => {
            const data: FinancialReportPdfData = {
              organization: { name: "VOC Church", document: "" },
              period: { month, year },
              summary: {
                income: totals.income,
                expense: totals.expense,
                balance,
                totalTransactions: safeRecords.length,
                byCategory: byCategory.map((c) => ({
                  name: c.label,
                  direction: c.direction,
                  total: c.total,
                })),
                byMethod: byMethod.map((m) => ({
                  method: m.label,
                  total: m.total,
                })),
              },
              records: safeRecords.map((r) => ({
                id: r.id,
                type: r.direction as "INCOME" | "EXPENSE",
                category: r.category?.name ?? "Sem categoria",
                amount: Number(r.amount),
                date: new Date(r.date),
                method: r.method,
                description: r.description ?? undefined,
                memberName: r.member?.fullName ?? undefined,
                eventName: r.event?.title ?? undefined,
              })),
              audit: {
                documentId: `${year}${String(month).padStart(2, "0")}`,
                createdAt: new Date(),
                generatedAt: new Date(),
              },
            };
            downloadPdf(
              <FinancialReport data={data} />,
              `relatorio-financeiro-${year}-${String(month).padStart(2, "0")}`,
            );
          }}
          className="rounded-lg bg-[var(--accent-purple)]/20 px-3 py-1.5 text-xs font-bold text-[var(--accent-purple)] transition-colors hover:bg-[var(--accent-purple)]/30"
        >
          Exportar PDF
        </button>
      </section>

      {/* SUMÁRIO */}
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Entradas"
          value={currencyFormatter.format(totals.income)}
          tone="text-[var(--accent-cyan)]"
        />
        <SummaryCard
          title="Saídas"
          value={currencyFormatter.format(totals.expense)}
          tone="text-[var(--accent-coral)]"
        />
        <SummaryCard
          title="Saldo"
          value={currencyFormatter.format(balance)}
          tone={
            balance >= 0
              ? "text-[var(--accent-cyan)]"
              : "text-[var(--accent-coral)]"
          }
        />
        <SummaryCard
          title="Transações"
          value={String(safeRecords.length)}
          tone="text-[var(--text-primary)]"
        />
      </section>

      <p className="text-xs text-[var(--text-muted)] italic">
        {monthNames[month - 1]} de {year} — {safeRecords.length}{" "}
        {safeRecords.length === 1 ? "movimentação" : "movimentações"}
      </p>

      {/* DETALHAMENTO */}
      <section className="grid gap-4 xl:grid-cols-2">
        <ReportCard title="Por categoria">
          <CategoryDoughnutChart data={byCategory} />
        </ReportCard>

        <ReportCard title="Por método">
          <MethodBarChart data={byMethod} grandTotal={grandTotal} />
        </ReportCard>
      </section>

      {/* LISTA DE REGISTROS */}
      <section>
        <h2 className="mb-4 text-sm font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
          Movimentações
        </h2>
        <ul role="list" className="space-y-4">
          {safeRecords.map((rec) => {
            const isIncome = rec.direction === "INCOME";
            const isCancelled = rec.status === "CANCELLED";
            const icon = isIncome
              ? "mdi:arrow-up-bold-circle"
              : "mdi:arrow-down-bold-circle";
            const color = isIncome
              ? "text-[var(--accent-cyan)]"
              : "text-[var(--accent-coral)]";
            const formattedDate = rec.date
              ? new Date(rec.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";
            const categoryName = rec.category?.name ?? "Sem categoria";

            return (
              <li
                key={rec.id}
                onClick={() => navigate(`/finance/${rec.id}`)}
                className={`card-premium group cursor-pointer p-4 transition-all hover:border-[var(--card-border-hover)] ${isCancelled ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-14 items-center justify-center rounded-xl bg-[var(--surface-alt)] ${color}`}
                  >
                    <Icon icon={icon} scale={1.2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {categoryName}
                      </p>
                      {isCancelled && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                          Cancelado
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {formattedDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${color}`}>
                      {isIncome ? "+" : "-"}{" "}
                      {currencyFormatter.format(Number(rec.amount))}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {rec.method}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Modal
        id="createFinancialRecordModal"
        className="flex"
        info="Registrar"
        scale={1.2}
      >
        <FinancialRecordForm />
      </Modal>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: string;
}) {
  return (
    <article className="card-premium p-5">
      <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
        {title}
      </p>
      <p className={`mt-3 text-2xl font-black ${tone}`}>{value}</p>
    </article>
  );
}

function ReportCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-premium p-5">
      <h2 className="mb-4 text-sm font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
