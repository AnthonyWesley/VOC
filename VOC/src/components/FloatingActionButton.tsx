// components/FloatingActionButton.tsx
import React from "react";
import Icon from "./Icon";

interface FloatingActionButtonProps {
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }[];
}

export default function FloatingActionButton({
  actions,
}: FloatingActionButtonProps) {
  return (
    <div className="fab bottom-16 lg:hidden">
      {/* Botão principal */}
      <div
        tabIndex={0}
        role="button"
        className="btn btn-lg btn-circle bg-slate-900"
      >
        <Icon icon="line-md:close-to-menu-transition" />
      </div>

      {/* Botão de fechar */}
      <div className="fab-close">
        Close{" "}
        <span className="btn btn-circle btn-lg btn-error">
          <Icon icon="line-md:menu-to-close-transition" />
        </span>
      </div>

      {/* Botões dinâmicos */}
      {actions.map((action, idx) => (
        <div key={idx}>
          {action.label}{" "}
          <button
            className="btn btn-lg btn-circle bg-slate-900"
            onClick={action.onClick}
          >
            {action.icon || action.label[0]}
          </button>
        </div>
      ))}
    </div>
  );
}
