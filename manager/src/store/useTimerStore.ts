import { create } from "zustand";

type TimerState = {
  expiresAt: Date | null;
  message: string;
  listeners: Array<() => void>;
  setTimer: (expiresAt: string, message: string, onExpire?: () => void) => void;
  clearTimer: () => void;
};

export const useTimerStore = create<TimerState>((set) => ({
  expiresAt: null,
  message: "",
  listeners: [],
  setTimer: (expiresAt, message, onExpire) =>
    set((state) => ({
      expiresAt: new Date(expiresAt),
      message,
      listeners: onExpire ? [...state.listeners, onExpire] : state.listeners,
    })),
  clearTimer: () => {
    localStorage.removeItem("alertTimer");
    set({
      expiresAt: null,
      message: "",
      listeners: [],
    });
  },
}));
