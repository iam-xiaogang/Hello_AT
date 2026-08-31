import { create } from "zustand";

const STORAGE_KEY = "toolbox.toolPrefs";

interface Prefs {
  recent: string[]; // 最近使用的工具 id（最新在前，最多 8 个）
  favorites: string[]; // 收藏的工具 id
}

interface ToolPrefsState extends Prefs {
  recordVisit: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

function load(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<Prefs>;
      return {
        recent: Array.isArray(d.recent) ? d.recent : [],
        favorites: Array.isArray(d.favorites) ? d.favorites : [],
      };
    }
  } catch {
    /* storage unavailable */
  }
  return { recent: [], favorites: [] };
}

function save(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
}

export const useToolPrefs = create<ToolPrefsState>((set, get) => ({
  ...load(),
  recordVisit: (id) => {
    if (!id) return;
    const { recent } = get();
    const next = [id, ...recent.filter((x) => x !== id)].slice(0, 8);
    save({ ...get(), recent: next });
    set({ recent: next });
  },
  toggleFavorite: (id) => {
    const { favorites } = get();
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    save({ ...get(), favorites: next });
    set({ favorites: next });
  },
}));
