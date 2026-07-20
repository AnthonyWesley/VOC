import { create } from "zustand";

type ModalStore = {
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id?: string) => void;
  isModalOpen: (id: string) => boolean;
  openModalsCount: () => number;
};

export const useModalStore = create<ModalStore>((set, get) => ({
  modals: {},

  openModal: (id) =>
    set((state) => ({
      modals: { ...state.modals, [id]: true },
    })),

  closeModal: (id?: string) =>
    set((state) => {
      if (id) {
        // fecha apenas o modal específico
        return { modals: { ...state.modals, [id]: false } };
      } else {
        // fecha todos os modais
        const allClosed = Object.fromEntries(
          Object.keys(state.modals).map((key) => [key, false]),
        );
        return { modals: allClosed };
      }
    }),

  isModalOpen: (id) => !!get().modals[id],

  openModalsCount: () => {
    const modals = get().modals;
    return Object.values(modals).filter(Boolean).length;
  },
}));
