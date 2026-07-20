import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStatus from "../auth/hooks/useAuthStatus";
import { useModalStore } from "../store/useModalStore";
import Icon from "./Icon";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  id: any;
  icon?: string;
  info?: string;
  infoDirection?: "top" | "bottom" | "left" | "right";
  text?: string;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  disableClose?: boolean;
  isPending?: boolean;
  action?: () => void;
  styleButton?: string;
  alert?: number;
  scale?: number;
  closeOnOverlayClick?: boolean;
  minLevel?: number;
}

export default function Modal({
  id,
  icon,
  text,
  children,
  className,
  color,
  disableClose,
  isPending,
  action,
  styleButton,
  info,
  infoDirection,
  scale,
  closeOnOverlayClick = false,
  minLevel = 0,
}: ModalProps) {
  const overlay = useRef(null);
  const { authLevel } = useAuthStatus();
  const { closeModal, isModalOpen, openModal } = useModalStore();
  const [mounted, setMounted] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [initialHeight, setInitialHeight] = useState<number | null>(null);

  useEffect(() => {
    const onResize = () => {
      const currentHeight = window.innerHeight;
      if (!initialHeight) {
        setInitialHeight(currentHeight);
        return;
      }
      setKeyboardOpen(currentHeight < initialHeight - 100);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initialHeight]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clickCloseRef: React.MouseEventHandler<HTMLElement> = (event) => {
    if (event.target === overlay.current) closeModal(id);
  };

  const trigger = icon && authLevel >= minLevel && (
    <div
      className={`flex justify-center rounded font-semibold transition duration-300 ease-in-out ${color} ${className}`}
      onClick={action ? action : () => openModal(id)}
    >
      <Icon
        isPending={isPending}
        text={text ?? ""}
        icon={icon}
        info={info}
        infoDirection={infoDirection}
        className={`cursor-pointer p-2 opacity-80 hover:opacity-100 ${styleButton}`}
        scale={scale}
      />
    </div>
  );

  const modalContent = (
    <AnimatePresence>
      {isModalOpen(id) && (
        <motion.section
          ref={overlay}
          onClick={closeOnOverlayClick ? clickCloseRef : () => {}}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: keyboardOpen ? "-20%" : "0%",
            }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg relative w-full max-w-3xl p-4"
            style={{
              maxHeight: "calc(var(--vh, 1vh) * 90)",
            }}
          >
            {!disableClose && (
              <Icon
                onClick={() => closeModal(id)}
                className="absolute top-0 right-0 z-999 animate-pulse cursor-pointer self-end p-4 transition-all hover:text-[var(--accent-coral)]"
                icon="line-md:close-small"
                scale={1}
              />
            )}
            {children}
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {trigger}
      {mounted && typeof window !== "undefined"
        ? createPortal(modalContent, document.getElementById("modal-root")!)
        : null}
    </>
  );
}
