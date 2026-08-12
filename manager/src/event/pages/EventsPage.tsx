import { useState } from "react";
import { addMonths, format, isSameDay, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import useEvents from "../hooks/queryEvents";
import { useMonthlyEventReport } from "../hooks/useMonthlyEventReport";
import { EventTypeFilter } from "../components/EventTypeFilter";
import { LEVEL } from "../../shared/constants/levels";
import { MonthYearFilter } from "../components/MonthFilter";
import Spin from "../../components/Spin";
import { EventType, ListEventsOutput } from "../types/eventTypes";
import { FormButton } from "../../components/FormButton";
import { PageHeader } from "../../components/PageHeader";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Icon from "../../components/Icon";
import { downloadPdf } from "../../pdf/download";
import { downloadExcelReport } from "../../helpers/reportExport";
import PdfHeader from "../../pdf/components/PdfHeader";
import PdfFooter from "../../pdf/components/PdfFooter";
import PdfSection from "../../pdf/components/PdfSection";
import PdfTable from "../../pdf/components/PdfTable";
import PdfAmountHighlight from "../../pdf/components/PdfAmountHighlight";
import { Document, Page } from "@react-pdf/renderer";
import { spacing, fontFamily } from "../../pdf/tokens";
import type { Column } from "../../pdf/components/PdfTable";
import EventCalendar from "../components/EventCalendar";

export default function EventsPage() {
  const navigate = useNavigate();
  const { authLevel } = useAuthStatus();

  const now = new Date();

  const [filters, setFilters] = useState<{
    type?: EventType;
    month: number;
    year: number;
  }>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents(filters);

  const events: ListEventsOutput[] =
    data?.pages.flatMap((page) => page.data ?? []) ?? [];

  const filteredEvents = selectedDate
    ? events.filter((e) => isSameDay(new Date(e.startsAt), selectedDate))
    : events;

  const { data: report } = useMonthlyEventReport({
    month: filters.month,
    year: filters.year,
    type: filters.type ?? "",
  });

  const exportRows = (report?.events ?? []).map((event) => ({
    Data: new Date(event.startsAt).toLocaleDateString("pt-BR"),
    Titulo: event.title || "Sem titulo",
    Tipo: event.type,
    Pregador: event.preacherName || "-",
    Membros: event.membersCount,
    Visitantes: event.visitorsCount,
    Escalas: event.assignmentsCount,
    Modo: event.attendanceMode,
  }));

  const filename = `relatorio-cultos-${filters.year}-${String(filters.month).padStart(2, "0")}`;

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

  if (error) return <p className="text-red-400">Erro ao carregar eventos.</p>;

  return (
    <div className="space-y-6 px-4 pb-5 md:px-6">
      <PageHeader
        icon="carbon:event"
        title="Cultos"
        subtitle="Cultos, reuniões e atividades da igreja"
        className="border-b border-[var(--card-border)] bg-none px-0 py-0 pb-4"
        onNew={() => navigate("/event/new")}
        minLevel={LEVEL.MINISTRY_LEADER}
      />

      {/* VISUALIZAÇÃO: LISTA / CALENDÁRIO */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setViewMode("list"); setSelectedDate(null); }}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            viewMode === "list"
              ? "bg-indigo-600/30 text-indigo-300"
              : "bg-gray-800/40 text-gray-500 hover:bg-gray-800/60"
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => { setViewMode("calendar"); setSelectedDate(null); }}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            viewMode === "calendar"
              ? "bg-indigo-600/30 text-indigo-300"
              : "bg-gray-800/40 text-gray-500 hover:bg-gray-800/60"
          }`}
        >
          Calendário
        </button>
      </div>

      {/* CALENDÁRIO */}
      {viewMode === "calendar" && (
        <EventCalendar
          currentMonth={calendarMonth}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
           onPrevMonth={() => { setCalendarMonth((m) => subMonths(m, 1)); setSelectedDate(null); }}
           onNextMonth={() => { setCalendarMonth((m) => addMonths(m, 1)); setSelectedDate(null); }}
        />
      )}

      {selectedDate && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">
            Eventos de <strong className="text-[var(--text-primary)]">{format(selectedDate, "dd 'de' MMMM")}</strong>
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* FILTROS + EXPORT */}
      <section
        className={`grid gap-4 ${authLevel >= 80 ? "md:grid-cols-4" : "md:grid-cols-2"}`}
      >
        <EventTypeFilter
          value={filters.type}
          onChange={(type) => setFilters((prev) => ({ ...prev, type }))}
        />
        <MonthYearFilter
          month={filters.month}
          year={filters.year}
          onChange={(period) => setFilters((prev) => ({ ...prev, ...period }))}
        />
        {authLevel >= 80 && (
          <>
            <button
              onClick={() =>
                downloadExcelReport(
                  filename,
                  [
                    { label: "Data", key: "Data" },
                    { label: "Titulo", key: "Titulo" },
                    { label: "Tipo", key: "Tipo" },
                    { label: "Pregador", key: "Pregador" },
                    { label: "Membros", key: "Membros" },
                    { label: "Visitantes", key: "Visitantes" },
                    { label: "Escalas", key: "Escalas" },
                    { label: "Modo", key: "Modo" },
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
                const columns: Column[] = [
                  { key: "date", label: "Data", width: "15%" },
                  { key: "title", label: "Título", width: "25%" },
                  { key: "type", label: "Tipo", width: "15%" },
                  { key: "preacher", label: "Pregador", width: "15%" },
                  {
                    key: "members",
                    label: "Membros",
                    width: "10%",
                    align: "right",
                  },
                  {
                    key: "visitors",
                    label: "Visitantes",
                    width: "10%",
                    align: "right",
                  },
                  {
                    key: "assignments",
                    label: "Escalas",
                    width: "10%",
                    align: "right",
                  },
                ];
                const tableData = (report?.events ?? []).map((e) => ({
                  date: new Date(e.startsAt).toLocaleDateString("pt-BR"),
                  title: e.title ?? "Sem título",
                  type: e.type,
                  preacher: e.preacherName ?? "-",
                  members: e.membersCount,
                  visitors: e.visitorsCount,
                  assignments: e.assignmentsCount,
                }));
                downloadPdf(
                  <Document>
                    <Page
                      size="A4"
                      style={{
                        padding: spacing.section,
                        fontFamily: fontFamily.regular,
                      }}
                    >
                      <PdfHeader
                        title="Relatório Mensal de Cultos"
                        subtitle={`${String(filters.month).padStart(2, "0")}/${filters.year}`}
                      />
                      {report && (
                        <>
                          <PdfSection title="Resumo">
                            <PdfAmountHighlight
                              items={[
                                {
                                  label: "Cultos",
                                  value: String(report.summary.totalEvents),
                                  color: "info",
                                },
                                {
                                  label: "Membros",
                                  value: String(report.summary.totalMembers),
                                  color: "income",
                                },
                                {
                                  label: "Visitantes",
                                  value: String(report.summary.totalVisitors),
                                  color: "neutral",
                                },
                                {
                                  label: "Média",
                                  value: String(report.summary.averageMembers),
                                  color: "info",
                                },
                              ]}
                            />
                          </PdfSection>
                          <PdfSection title="Eventos">
                            <PdfTable columns={columns} data={tableData} />
                          </PdfSection>
                        </>
                      )}
                      <PdfFooter generatedAt={new Date()} />
                    </Page>
                  </Document>,
                  filename,
                );
              }}
              className="rounded-lg bg-[var(--accent-purple)]/20 px-3 py-1.5 text-xs font-bold text-[var(--accent-purple)] transition-colors hover:bg-[var(--accent-purple)]/30"
            >
              Exportar PDF
            </button>
          </>
        )}
      </section>

      {/* SUMÁRIO */}
      {report && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              title="Cultos"
              value={String(report.summary.totalEvents)}
              tone="text-[var(--accent-cyan)]"
            />
            <SummaryCard
              title="Membros"
              value={String(report.summary.totalMembers)}
              tone="text-[var(--accent-cyan)]"
            />
            <SummaryCard
              title="Visitantes"
              value={String(report.summary.totalVisitors)}
              tone="text-[var(--text-primary)]"
            />
            <SummaryCard
              title="Média membros"
              value={String(report.summary.averageMembers)}
              tone="text-[var(--accent-cyan)]"
            />
          </section>

          <p className="text-xs text-[var(--text-muted)] italic">
            {monthNames[filters.month - 1]} de {filters.year} —{" "}
            {report.events.length}
            {report.events.length === 1 ? " evento" : " eventos"}
          </p>
        </>
      )}

      {isLoading ? (
        <Spin no-modal />
      ) : (
        <ul role="list" className="space-y-4">
          {filteredEvents.map((event) => {
            const formattedDate = new Date(event.startsAt).toLocaleString(
              "pt-BR",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            return (
              <li
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="card-premium group cursor-pointer p-4 transition-all hover:border-[var(--card-border-hover)]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-sky-300">
                    <Icon icon="carbon:event" scale={1.2} />
                  </div>

                  <div className="flex-1">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {event.title ?? "Sem titulo"}
                    </p>

                    {event.theme && (
                      <p className="text-sm text-[var(--text-muted)]">
                        Tema: {event.theme}
                      </p>
                    )}

                    <p className="text-xs text-[var(--text-muted)]">
                      {formattedDate}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <FormButton
            label={isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            icon="mdi:arrow-down"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full md:w-xl"
          />
        </div>
      )}
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
