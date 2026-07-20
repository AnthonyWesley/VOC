import { create } from "zustand";

type EventToPostData = {
  title: string;
  type: string;
  startsAt: string;
} | null;

type EventToPostStore = {
  data: EventToPostData;
  setData: (data: EventToPostData) => void;
  clear: () => void;
};

export const useEventToPostStore = create<EventToPostStore>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null }),
}));
