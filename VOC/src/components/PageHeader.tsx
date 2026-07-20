import { useNavigate } from "react-router-dom";
import useAuthStatus from "../auth/hooks/useAuthStatus";
import Icon from "./Icon";

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  className?: string;
  back?: boolean;
  onNew?: () => void;
  minLevel?: number;
}

export const PageHeader = ({
  icon,
  title,
  subtitle,
  className,
  back = false,
  onNew,
  minLevel = 0,
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const { authLevel } = useAuthStatus();

  return (
    <header
      className={`${className} p-6 text-[var(--text-primary)]`}
    >
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex w-full items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-top)] backdrop-blur-md">
            <Icon icon={icon} scale={0.6} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight uppercase text-[var(--text-primary)]">
              {title}
            </h1>

            {subtitle && (
              <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
                {subtitle}
              </p>
            )}
          </div>

          {back && (
            <span className="ml-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-top)] p-4 text-[var(--text-secondary)] hover:bg-[var(--card-bot)]">
              <Icon
                text="Voltar"
                icon="mdi:arrow-left"
                onClick={() => navigate(-1)}
              />
            </span>
          )}
        </div>

        {onNew && authLevel >= minLevel && (
          <section className="flex w-full justify-end gap-2 lg:w-auto">
            <span
              onClick={() => navigate(-1)}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-top)] p-4 text-[var(--text-secondary)] hover:bg-[var(--card-bot)]"
            >
              <Icon text="Voltar" icon="mdi:arrow-left" />
            </span>
            <span
              onClick={onNew}
              className="flex w-full items-center justify-center rounded-xl bg-[var(--accent-cyan)]/20 p-4 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 lg:w-52"
            >
              <Icon text="Novo" icon="ic:baseline-plus" />
            </span>
          </section>
        )}
      </div>
    </header>
  );
};
