import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalStore } from "../store/useModalStore";

interface ModalProps {
  id: string;
  title?: string;
  children?: React.ReactNode;
  disableClose?: boolean;
  closeOnOverlayClick?: boolean;
}

export default function Modal({
  id,
  title,
  children,
  disableClose,
  closeOnOverlayClick = true,
}: ModalProps) {
  const overlay = useRef(null);
  const { closeModal, isModalOpen } = useModalStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clickCloseRef: React.MouseEventHandler<HTMLElement> = (event) => {
    if (event.target === overlay.current) closeModal(id);
  };

  const modalContent = (
    <AnimatePresence>
      {isModalOpen(id) && (
        <motion.div
          ref={overlay}
          onClick={closeOnOverlayClick ? clickCloseRef : () => {}}
          className="modal modal-open"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="modal-box relative"
          >
            {!disableClose && (
              <button
                onClick={() => closeModal(id)}
                className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
              >
                ✕
              </button>
            )}

            {title && <h3 className="text-lg font-bold">{title}</h3>}
            <div className="py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted
    ? createPortal(modalContent, document.getElementById("modal-root")!)
    : null;
}
