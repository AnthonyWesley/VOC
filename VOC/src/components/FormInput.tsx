import { Icon } from "@iconify/react";
import Cleave from "cleave.js/react";
import { fieldFormatter } from "../helpers/fieldFormatter";

type FormInputVariant = "full" | "auto" | "sm" | "md" | "lg" | "unstyled";

type FormInputType =
  | "text"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "tel"
  | "password"
  | "currency-brl"
  | "currency-gbp"
  | "datetime-local"
  | "postcode-uk";

interface FormInputProps {
  label?: string;
  icon?: string;
  type?: FormInputType;
  value?: any;
  required?: boolean;
  error?: string;
  onChange?: (e: React.ChangeEvent<any>) => void;
  onValueChange?: (val: string) => void;
  onFocus?: (e: React.FocusEvent<any>) => void;
  onBlur?: (e: React.FocusEvent<any>) => void;
  options?: { label: string; value: string }[];
  className?: string;
  disabled?: boolean;
  rows?: number;
  name?: string;
  placeholder?: string;
  variant?: FormInputVariant;
  // Novas props para controle do telefone interno
  phoneCountry?: "br" | "uk";
  onPhoneCountryChange?: (country: "br" | "uk") => void;
}

const variantClasses: Record<FormInputVariant, string> = {
  full: "w-full",
  auto: "w-auto",
  sm: "w-36",
  md: "w-68",
  lg: "w-100",
  unstyled: "",
};

export const FormInput = ({
  label,
  icon,
  type = "text",
  value,
  onChange,
  onValueChange,
  options,
  className,
  required,
  error,
  rows = 3,
  variant = "full",
  phoneCountry = "br",
  onPhoneCountryChange,
  ...props
}: FormInputProps) => {
  // Ajustamos o padding esquerdo quando for do tipo 'tel' para dar espaço aos botões de país
  const isTel = type === "tel";

  const base = `
    ${variantClasses[variant ?? "full"]}
    rounded-lg border bg-[var(--card-top)]
    text-sm text-[var(--text-primary)] transition-all outline-none
    focus:ring-1 focus:ring-[var(--accent-cyan)]/20
    placeholder:text-[var(--text-muted)]
    md:text-base pr-4
    ${isTel ? "pl-24" : "pl-12"} 
    ${type === "textarea" ? "py-4" : "h-13"}
    ${error ? "border-red-500 focus:border-red-500" : "border-[var(--card-border)] focus:border-[var(--accent-cyan)]"}
  `;

  const renderField = () => {
    if (type === "currency-brl") {
      return (
        <Cleave
          {...props}
          value={value}
          options={{
            numeral: true,
            numeralDecimalMark: ",",
            delimiter: ".",
            prefix: "R$ ",
            numeralThousandsGroupStyle: "thousand",
          }}
          onChange={(e) =>
            onValueChange ? onValueChange(e.target.value) : onChange?.(e)
          }
          className={base}
        />
      );
    }

    if (type === "currency-gbp") {
      return (
        <Cleave
          {...props}
          value={value}
          options={{
            numeral: true,
            numeralDecimalMark: ".",
            delimiter: ",",
            prefix: "\u00A3",
            numeralThousandsGroupStyle: "thousand",
          }}
          onChange={(e) =>
            onValueChange ? onValueChange(e.target.value) : onChange?.(e)
          }
          className={base}
        />
      );
    }

    if (type === "tel") {
      // Definimos a máscara dinamicamente baseado na prop interna phoneCountry
      const cleaveOptions =
        phoneCountry === "uk"
          ? {
              blocks: [5, 6, 2],
              delimiters: [" ", " ", " "],
              numericOnly: true,
            } // UK: 44712 345678 89
          : {
              blocks: [2, 5, 4],
              delimiters: ["(", ") ", "-"],
              numericOnly: true,
            }; // BR: (11) 99210-1557

      return (
        <Cleave
          {...props}
          key={phoneCountry} // Força o Cleave a reinicializar quando o país mudar
          value={value}
          onChange={(e) =>
            onValueChange ? onValueChange(e.target.value) : onChange?.(e)
          }
          required={required}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          options={cleaveOptions}
          className={base}
        />
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          {...props}
          rows={rows}
          value={value}
          required={required}
          onChange={onChange}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          className={base}
        />
      );
    }

    if (type === "select") {
      return (
        <select
          {...props}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          className={`${base} select select-bordered select-lg`}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "postcode-uk") {
      return (
        <input
          {...props}
          type="text"
          value={value}
          required={required}
          placeholder="SW1A 1AA"
          onChange={(e) => {
            const formatted = fieldFormatter.postalCodeUK(e.target.value);
            const cursor = e.target.selectionStart;
            const oldLen = e.target.value.length;
            const newLen = formatted.length;
            onChange?.({
              ...e,
              target: { ...e.target, value: formatted },
            });
            requestAnimationFrame(() => {
              const offset = cursor ? cursor + (newLen - oldLen) : 0;
              e.target.setSelectionRange(offset, offset);
            });
          }}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          className={base}
        />
      );
    }

    return (
      <input
        {...props}
        type={type}
        value={value}
        required={required}
        onChange={onChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        className={base}
      />
    );
  };

  return (
    <div className={`space-y-1 ${className ? className : ""}`}>
      {label && (
        <label className="ml-1 flex items-center gap-1 text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="group relative">
        {/* INDICADOR DE CAMPO OBRIGATÓRIO */}
        {required && (
          <div className="absolute left-0 top-1/2 z-10 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--accent-cyan)]/50" />
        )}

        {/* ÍCONE PADRÃO (Ocultado se for Telefone para não tumultuar) */}
        {icon && !isTel && (
          <Icon
            icon={icon}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--accent-cyan)]"
            width="20"
          />
        )}

        {/* SELETOR DE PAÍS EMbutido (Apenas se type="tel") */}
        {isTel && (
          <div className="absolute top-1/2 left-3 z-10 flex -translate-y-1/2 items-center gap-1 rounded bg-[var(--card-border)]/30 p-1">
            <button
              type="button"
              onClick={() => onPhoneCountryChange?.("br")}
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition-all ${
                phoneCountry === "br"
                  ? "bg-[var(--accent-cyan)] text-slate-900 shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
              title="Brasil"
            >
              BR
            </button>
            <button
              type="button"
              onClick={() => onPhoneCountryChange?.("uk")}
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition-all ${
                phoneCountry === "uk"
                  ? "bg-[var(--accent-cyan)] text-slate-900 shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
              title="United Kingdom"
            >
              UK
            </button>
          </div>
        )}

        {renderField()}
      </div>

      {error && <p className="ml-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
};
