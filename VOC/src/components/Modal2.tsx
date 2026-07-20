import { ReactNode, useRef } from "react";
import Icon from "./Icon";
import { useModalStore } from "../store/useModalStore";

interface ModalProps {
  id: string;
  trigger: { icon?: string; info?: string; scale?: number };
  children: ReactNode;
}

export function Modal2({ id, trigger, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const closeAll = useModalStore((s) => s.closeModal);

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    // Fecha TODOS os modais no store
    closeAll();
  };

  return (
    <>
      {/* Trigger */}
      <span onClick={openModal} className="cursor-pointer">
        <Icon
          icon={trigger.icon ?? "mdi:plus"}
          info={trigger.info}
          scale={trigger.scale ?? 1}
        />
      </span>

      <dialog
        id={id}
        ref={dialogRef}
        className="modal"
        onClose={handleClose} // DaisyUI dispara isso ao clicar fora ou ESC
      >
        <div className="modal-box p-0">{children}</div>

        {/* Backdrop DaisyUI */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleClose}>close</button>
        </form>
      </dialog>
    </>
  );
}
