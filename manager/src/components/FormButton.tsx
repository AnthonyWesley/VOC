import Icon from "./Icon";

type ButtonVariant = "primary" | "success" | "danger" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonWidth = "full" | "auto" | "block";

type FormButtonProps = {
  label: string;
  icon?: string;
  isPending?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)]/40 hover:bg-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]",
  success:
    "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400",
  danger:
    "bg-[var(--accent-coral)]/20 border-[var(--accent-coral)]/40 hover:bg-[var(--accent-coral)]/30 text-[var(--accent-coral)]",
  outline:
    "bg-transparent border-[var(--card-border)] hover:bg-[var(--card-top)] text-[var(--text-secondary)]",
  ghost:
    "bg-transparent border-transparent hover:bg-[var(--card-top)] text-[var(--text-secondary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 text-xs px-3",
  md: "h-12 text-sm px-4",
  lg: "h-14 text-base px-6",
};

const widthClasses: Record<ButtonWidth, string> = {
  full: "",
  auto: "w-auto",
  block: " md:w-auto",
};

export function FormButton({
  label,
  icon,
  isPending,
  onClick,
  type = "button",
  className = "w-full",
  disabled,
  variant = "primary",
  size = "md",
  width = "full",
}: FormButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isPending}
      className={`flex items-center justify-center gap-2 rounded-lg border font-bold tracking-wide transition-all outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/20 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses[width]} ${className || ""}`}
    >
      {icon && (
        <Icon
          icon={isPending ? "line-md:loading-twotone-loop" : icon}
          scale={0.7}
          className={isPending ? "animate-spin" : ""}
        />
      )}
      {label}
    </button>
  );
}
