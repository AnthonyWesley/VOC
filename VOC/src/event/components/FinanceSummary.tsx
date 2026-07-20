import { Balloon } from "../../components/Balloon";

type Props = {
  income?: number | null;
  expense?: number | null;
  balance?: number | null;
};

export default function FinanceSummary({ income, expense, balance }: Props) {
  return (
    <Balloon offset={40}>
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Resumo</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
            Entradas
          </p>
          <p className="font-mono text-sm text-emerald-500">
            R$ {income?.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-[10px] font-bold tracking-wider text-red-400 uppercase">
            Saídas
          </p>
          <p className="font-mono text-sm text-red-500">
            R$ {expense?.toFixed(2)}
          </p>
        </div>

        <div
          className={`rounded-lg border p-3 ${
            (balance || 0) >= 0
              ? "border-white/10 bg-white/5"
              : "border-orange-500/20 bg-orange-500/10"
          }`}
        >
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Saldo
          </p>

          <p
            className={`font-mono text-sm ${
              (balance || 0) >= 0 ? "text-[var(--text-primary)]" : "text-orange-500"
            }`}
          >
            R$ {balance?.toFixed(2)}
          </p>
        </div>
      </div>
    </Balloon>
  );
}
