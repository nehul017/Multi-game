import { create } from 'zustand';
import { ReactNode } from 'react';

interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: ReactNode | null;
  modalTitle: string;
  theme: 'dark';
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (title: string, content: ReactNode) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  sidebarOpen: true,
  modalOpen: false,
  modalContent: null,
  modalTitle: '',
  theme: 'dark',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openModal: (title, content) =>
    set({ modalOpen: true, modalTitle: title, modalContent: content }),

  closeModal: () =>
    set({ modalOpen: false, modalContent: null, modalTitle: '' }),
}));
