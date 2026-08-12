import Icon from "../../components/Icon";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  highlight?: "positive" | "negative";
}

export function StatCard({ icon, label, value, highlight }: StatCardProps) {
  const iconVariants = {
    positive: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    negative: "bg-red-500/10 text-red-400 border border-red-500/20",
    default: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-800/80 p-4 shadow-sm transition-all duration-200 hover:bg-slate-800/30">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${iconVariants[highlight || "default"]}`}
      >
        <Icon icon={icon} scale={0.8} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}
