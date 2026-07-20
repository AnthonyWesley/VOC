import { useModalStore } from "../store/useModalStore";
import { fluidScale } from "../helpers/fluidScale";
import Icon from "./Icon";

export type DialogProps = {
  message: string;
  onClick: () => void;
  color?: string;
  admin?: boolean;
  disabled?: boolean;

  id?: string;
};
export default function Dialog({
  message,
  onClick,
  color,
  disabled,
  id,
}: DialogProps) {
  const { closeModal } = useModalStore();
  const handleClick = () => {
    onClick();
    if (id) closeModal(id);
  };
  return (
    <section className="relative flex flex-col items-center gap-4 rounded-lg bg-slate-900/90 p-4">
      <span className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20">
        <Icon icon="line-md:alert-loop" className="text-rose-400" />
      </span>

      <div
        className="px-6 py-4 text-center leading-relaxed text-slate-200"
        style={{ fontSize: fluidScale(0.75) }}
      >
        {message}
      </div>

      <button
        className={` ${color} btn w-full max-w-xs rounded-md bg-slate-800 p-2 text-[var(--text-primary)] hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-40`}
        onClick={handleClick}
        disabled={disabled}
        style={{ fontSize: fluidScale(0.7) }}
      >
        CONFIRMAR
      </button>
    </section>
  );
}
