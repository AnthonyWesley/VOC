import { useMemo } from "react";
import Spin from "../../components/Spin";
import Icon from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import { DashboardSection } from "../components/DashboardSection";
import useDashboard from "../../home/hooks/useDashboard";
import useMinistries from "../../ministry/hooks/useMinistries";
import type { DashboardData } from "../types/dashboard.types";

export default function DashboardPage() {
  const { queryDashboard } = useDashboard();

  const { data, isPending, error } = queryDashboard as {
    data: DashboardData;
    isPending: boolean;
    error: any;
  };

  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format;
  }, []);

  const { queryMinistries } = useMinistries();

  if (isPending) return <Spin />;
  if (error) {
    return (
      <p className="p-6 text-center text-[var(--accent-coral)]">
        Erro ao carregar dados do dashboard
      </p>
    );
  }
  if (!data) {
    return (
      <p className="p-6 text-center text-[var(--text-muted)]">
        Nenhum dado encontrado
      </p>
    );
  }

  const { members, finance, events } = data;
  const ministriesCount = queryMinistries.data?.length ?? 0;

  return (
    // Removido o lg:h-[90dvh] e lg:overflow-y-scroll para evitar rolagens duplas na tela inteira
    <div className="w-full space-y-6 px-4 pb-8 md:px-6">
      <PageHeader
        icon="mdi:view-dashboard"
        title="Dashboard"
        subtitle="Resumo geral da igreja"
        className="border-b border-[var(--card-border)] bg-none px-0 py-0 pb-4"
      />

      <div className="space-y-6">
        {/* SEÇÃO: MEMBROS */}
        <DashboardSection title="Membros">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              icon="mdi:account-group"
              label="Total"
              value={members.total}
            />
            <StatCard
              icon="mdi:account-check"
              label="Ativos"
              value={members.active}
            />
            <StatCard
              icon="mdi:account-question"
              label="Visitantes"
              value={members.visitors}
            />
            <div className="col-span-2 sm:col-span-1">
              <StatCard
                icon="mdi:account-plus"
                label="Novos no mês"
                value={members.newThisMonth}
              />
            </div>
          </div>
        </DashboardSection>

        {/* SEÇÃO: FINANCEIRO */}
        <DashboardSection title="Financeiro">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon="mdi:cash-plus"
              label="Entradas no mês"
              value={formatCurrency(finance.incomeThisMonth)}
              highlight="positive"
            />
            <StatCard
              icon="mdi:cash-minus"
              label="Saídas no mês"
              value={formatCurrency(finance.expenseThisMonth)}
              highlight="negative"
            />
            <StatCard
              icon="mdi:scale-balance"
              label="Balanço"
              value={formatCurrency(finance.balanceThisMonth)}
              highlight={
                finance.balanceThisMonth >= 0 ? "positive" : "negative"
              }
            />
          </div>
        </DashboardSection>

        {/* SEÇÃO: MÉTRICAS */}
        <DashboardSection title="Métricas">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
            <StatCard
              icon="mdi:calendar-check"
              label="Próximos cultos"
              value={events.upcoming.length}
            />
            {/* <StatCard
              icon="mdi:account-group"
              label="Membros"
              value={members.total}
            /> */}
            <StatCard
              icon="mdi:account-star"
              label="Liderança ativa"
              value={members.active}
            />
            <StatCard
              icon="mdi:church"
              label="Ministérios"
              value={ministriesCount}
            />
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

type StatCardProps = {
  icon?: string;
  label: string;
  value: string | number;
  highlight?: "positive" | "negative";
};

export function StatCard({ icon, label, value, highlight }: StatCardProps) {
  const valueColor =
    highlight === "positive"
      ? "text-[var(--accent-cyan)]"
      : highlight === "negative"
        ? "text-[var(--accent-coral)]"
        : "text-[var(--text-primary)]";

  return (
    <div className="card-premium flex w-full items-center gap-3 p-3.5 md:p-4">
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg text-[var(--text-muted)]">
          <Icon icon={icon} className="text-xl" scale={0.8} />
        </div>
      )}
      <div className="flex min-w-0 flex-col text-left">
        <span className="truncate text-xs font-medium text-[var(--text-muted)] md:text-sm">
          {label}
        </span>
        <span
          className={`text-lg font-bold tracking-tight md:text-2xl ${valueColor} truncate`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
