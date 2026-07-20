import { create } from "zustand";

type TourStepGroup = "ranking" | "activeEvent" | "firstEvent";

type TourStore = {
  nextTour: TourStepGroup | null;
  setNextTour: (group: TourStepGroup | null) => void;
};

export const useTourStore = create<TourStore>((set) => ({
  nextTour: null,
  setNextTour: (group) => set({ nextTour: group }),
}));
