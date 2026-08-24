import { create } from "zustand";

const STORAGE_KEY = "toolbox.sidebarCollapsed";

function initialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  sidebarCollapsed: initialCollapsed(),
  toggleSidebarCollapsed: () =>
    set((state) => {
      const sidebarCollapsed = !state.sidebarCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? "1" : "0");
      } catch {
        /* storage unavailable: keep in-memory state only */
      }
      return { sidebarCollapsed };
    }),
}));
