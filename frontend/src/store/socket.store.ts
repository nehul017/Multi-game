import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

interface SocketActions {
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const useSocketStore = create<SocketState & SocketActions>()((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: [],

  connect: (token: string) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('users:online', (users: string[]) => {
      set({ onlineUsers: users });
    });

    socket.on('user:online', (userId: string) => {
      set((state) => ({
        onlineUsers: [...state.onlineUsers.filter((id) => id !== userId), userId],
      }));
    });

    socket.on('user:offline', (userId: string) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((id) => id !== userId),
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: [] });
    }
  },

  emit: (event: string, data?: unknown) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit(event, data);
    }
  },

  on: (event: string, callback: (...args: unknown[]) => void) => {
    const socket = get().socket;
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event: string, callback?: (...args: unknown[]) => void) => {
    const socket = get().socket;
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  },
}));
