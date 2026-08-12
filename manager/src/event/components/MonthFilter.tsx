import { FormInput } from "../../components/FormInput";

const months = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

interface Props {
  month: number;
  year: number;
  onChange: (value: { month: number; year: number }) => void;
}

export function MonthYearFilter({ month, year, onChange }: Props) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex gap-2 lg:flex-row">
      {/* MÊS */}
      <FormInput
        label="Mês"
        icon="mdi:calendar-month-outline"
        type="select"
        value={month}
        onChange={(e) => onChange({ month: Number(e.target.value), year })}
        options={months.map((m) => ({
          label: m.label,
          value: String(m.value),
        }))}
        className="w-full lg:min-w-[160px]"
      />

      {/* ANO */}
      <FormInput
        label="Ano"
        icon="mdi:calendar-range"
        type="select"
        value={year}
        onChange={(e) => onChange({ month, year: Number(e.target.value) })}
        options={Array.from({ length: 5 }, (_, i) => {
          const y = currentYear - 2 + i;
          return { label: String(y), value: String(y) };
        })}
        className="w-full lg:min-w-[120px]"
      />
    </div>
  );
}
