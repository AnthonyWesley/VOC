// CardActions.tsx
import useAuthStatus from "../auth/hooks/useAuthStatus";
import Icon from "./Icon";
import Modal from "./Modal";

interface ActionItem {
  icon: string;
  info: string;
  onClick?: () => void;
  modalId?: string;
  content?: React.ReactNode;
  scale?: number;
  minLevel?: number;
}

interface CardActionsProps {
  actions: ActionItem[];
  direction?: "vertical" | "horizontal";
  fixed?: boolean;
}

export function CardActions({
  actions,
  direction = "vertical",
  fixed = false,
}: CardActionsProps) {
  const { authLevel } = useAuthStatus();
  const layout = direction === "vertical" ? "flex-col" : "flex-row";

  // Quando fixed = true → nada de translate, nada de hover
  const motion = fixed
    ? "opacity-100 translate-x-0 translate-y-0"
    : direction === "vertical"
      ? "opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
      : "opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0";

  return (
    <div
      className={`absolute right-0 bottom-0 flex ${layout} gap-4 transition-all duration-200 ${motion}`}
    >
      {actions
        .filter((a) => authLevel >= (a.minLevel ?? 0))
        .map((action, i) => (
          <div
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/5"
          >
            {action.modalId ? (
              <Modal
                id={action.modalId}
                icon={action.icon}
                scale={action.scale ?? 1}
                info={action.info}
                infoDirection="left"
                minLevel={0}
              >
                {action.content}
              </Modal>
            ) : (
              <button
                onClick={action.onClick}
                className="cursor-pointer opacity-80 hover:opacity-100"
              >
                <Icon
                  icon={action.icon}
                  scale={action.scale ?? 1}
                  info={action.info}
                  infoDirection="left"
                />
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
