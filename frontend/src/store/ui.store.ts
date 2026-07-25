import { create } from 'zustand';
import { ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: ReactNode | null;
  modalTitle: string;
  theme: Theme;
  maintenanceMode: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (title: string, content: ReactNode) => void;
  closeModal: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
  setMaintenanceMode: (enabled: boolean) => void;
}

const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('multigame-theme', theme);
  }
};

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  sidebarOpen: false,
  modalOpen: false,
  modalContent: null,
  modalTitle: '',
  theme: 'dark',
  maintenanceMode: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setMaintenanceMode: (enabled) => set({ maintenanceMode: enabled }),

  openModal: (title, content) =>
    set({ modalOpen: true, modalTitle: title, modalContent: content }),

  closeModal: () =>
    set({ modalOpen: false, modalContent: null, modalTitle: '' }),

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('multigame-theme') as Theme | null;
    const theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    applyTheme(theme);
    set({ theme });
  },
}));
