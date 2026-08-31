import { create } from "zustand";

const STORAGE_KEY = "toolbox.sidebarCollapsed";
const THEME_KEY = "toolbox.theme";

type Theme = "light" | "dark";

function initialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage unavailable */
  }
  return "light";
}

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  theme: Theme;
  toggleTheme: () => void;
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
  theme: initialTheme(),
  toggleTheme: () =>
    set((state) => {
      const theme: Theme = state.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        /* storage unavailable */
      }
      return { theme };
    }),
}));
