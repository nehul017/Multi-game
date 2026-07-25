import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import api from '@/lib/api';
import { toId } from '@/lib/id';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  refreshTokenAction: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { tokens, user } = data.data;
          const { accessToken, refreshToken } = tokens;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({
            user: { ...user, id: toId(user._id || user.id) },
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string, referralCode?: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', {
            username,
            email,
            password,
            ...(referralCode ? { referralCode } : {}),
          });
          const { tokens, user } = data.data;
          const { accessToken, refreshToken } = tokens;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({
            user: { ...user, id: toId(user._id || user.id) },
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshTokenAction: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) throw new Error('No refresh token');
          const { data } = await api.post('/auth/refresh', { refreshToken: currentRefreshToken });
          const { accessToken, refreshToken } = data.data;
          localStorage.setItem('token', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          set({ token: accessToken, refreshToken: refreshToken || currentRefreshToken });
        } catch {
          get().logout();
        }
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initialize: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          const { data } = await api.get('/auth/me');
          const userData = data.data;
          const user = { ...userData, id: toId(userData._id || userData.id) };
          set({
            user,
            token,
            refreshToken: localStorage.getItem('refreshToken'),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({ isLoading: false, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
