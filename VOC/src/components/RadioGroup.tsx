import { Icon } from "@iconify/react/dist/iconify.js";

type RadioOption<T> = {
  label: string;
  value: T;
  icon: string;
};

type RadioGroupProps<T> = {
  options: RadioOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
  direction?: "row" | "col";
  name: string;
};

export default function RadioGroup<T extends string | number>({
  options,
  selected,
  onChange,
  className,
  direction = "row",
  name,
}: RadioGroupProps<T>) {
  return (
    <div
      className={`radio-input flex w-full gap-2 ${direction === "row" ? "flex-row" : "flex-col"}`}
    >
      {options.map((option, i) => (
        <label key={i} className="flex w-full items-center gap-1">
          <input
            type="radio"
            name={name}
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
            className="custom-radio custom-container size-6 flex-none rounded-full"
          />

          <Icon icon={option.icon} width={35} />
          <div
            className={`custom-container flex w-full items-center gap-1 rounded-sm px-2 py-0.5 ${className}`}
          >
            <span>{option.label}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
