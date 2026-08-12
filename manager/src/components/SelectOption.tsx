import Icon from "./Icon";

type SelectOptionProps<T extends string> = {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Record<T, string>;
  alerts?: Record<T, string>;
  classNames?: Record<T, string>;
  icons?: Record<T, string>; // Novo formato: ícone por opção
};

export function SelectOption<T extends string>({
  options,
  value,
  onChange,
  labels,
  alerts,
  classNames,
  icons,
}: SelectOptionProps<T>) {
  // const isFirst = (index: number) => index === 0;
  // const isLast = (index: number) => index === options.length - 1;

  return (
    <section className="flex w-full flex-col items-center rounded-lg border border-gray-500/35 bg-slate-950 p-2">
      <div className="mx-auto flex w-full items-center justify-center">
        {options.map((option) => (
          <div
            key={option}
            // type="button"
            onClick={() => onChange(option)}
            className={`flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-sm text-xs ${value === option ? (classNames?.[option] ?? "bg-blue-500") : ""} `}
          >
            {icons?.[option] && (
              <Icon
                icon={icons[option]}
                indicator={
                  alerts?.[option] ? Number(alerts[option]) : undefined
                }
                text={labels?.[option] ?? ""}
                scale={0.6}
                className={`cursor-pointer ${
                  value === option ? "text-slate-200" : "text-slate-50"
                }`}
              />
              // <Icon icon={icons[option]} className="text-lg" />
            )}
            {/* {labels?.[option]} */}
          </div>
        ))}
      </div>
    </section>
  );
}
