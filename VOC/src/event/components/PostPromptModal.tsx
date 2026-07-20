import { useEffect } from "react";
import Modal from "../../components/Modal";
import PostForm from "../../post/components/PostForm";
import { useModalStore } from "../../store/useModalStore";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { useEventToPostStore } from "../stores/useEventToPostStore";

export default function PostPromptModal() {
  const { authUserId } = useAuthStatus();
  const { data, clear } = useEventToPostStore();
  const { openModal, closeModal } = useModalStore();
  const modalId = "postPromptModal";

  useEffect(() => {
    if (data) {
      openModal(modalId);
    }
  }, [data, openModal]);

  const handleClose = () => {
    closeModal(modalId);
    clear();
  };

  if (!data) return null;

  return (
    <Modal id={modalId} info="Criar Publicação" disableClose>
      <div className="space-y-2 p-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Publicação sobre: <strong className="text-[var(--text-primary)]">{data.title}</strong>
          </p>
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Pular
          </button>
        </div>
        <PostForm
          authorId={authUserId ?? ""}
          initialTitle={data.title}
          initialContent={`Evento: ${data.title} (${new Date(data.startsAt).toLocaleDateString("pt-BR")})`}
        />
      </div>
    </Modal>
  );
}
