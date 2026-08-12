import { Icon } from "@iconify/react";

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: string;
}

export const FormSelect = ({
  label,
  icon,
  children,
  className,
  ...props
}: FormSelectProps) => {
  const base = `
    w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card-top)] py-6 pr-4 pl-12
    text-sm text-[var(--text-primary)] transition-all outline-none
    focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/20
    placeholder:text-[var(--text-muted)] md:text-base
    ${className || ""}
  `;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="ml-1 text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase">
          {label}
        </label>
      )}
      <div className="group relative">
        {icon && (
          <Icon
            icon={icon}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--accent-cyan)]"
            width="20"
          />
        )}
        <select {...props} className={base}>
          {children}
        </select>
      </div>
    </div>
  );
};
