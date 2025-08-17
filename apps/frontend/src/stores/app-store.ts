import { create } from "zustand";

export type FirebotTheme = "shadow" | "slate" | "storm" | "snow";

interface AppState {
  trailingBreadcrumb?: string;
  setTrailingBreadcrumb: (newName?: string) => void;
  theme: FirebotTheme;
  setTheme: (theme: FirebotTheme) => void;
}

const useAppStore = create<AppState>()((set) => ({
  trailingBreadcrumb: undefined,
  setTrailingBreadcrumb: (newName) => set({ trailingBreadcrumb: newName }),
  theme: "shadow",
  setTheme: (theme) => {
    if (document) {
      const root = document.getElementById("root");
      if (root) {
        root.setAttribute("data-theme", theme);
      }
    }
    set({ theme });
  },
}));

export default useAppStore;
