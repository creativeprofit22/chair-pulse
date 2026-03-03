import { create } from 'zustand';

export type ViewId =
  | 'import'
  | 'dashboard'
  | 'no-shows'
  | 'utilization'
  | 'services'
  | 'ai-insights'
  | 'settings';

interface UIState {
  activeView: ViewId;
  sidebarCollapsed: boolean;

  setActiveView: (view: ViewId) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'import',
  sidebarCollapsed: false,

  setActiveView: (view) => set({ activeView: view }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
