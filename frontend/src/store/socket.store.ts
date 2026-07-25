import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

type SocketCallback = (...args: unknown[]) => void;

interface SocketState {
  socket: Socket | null;
  gameSocket: Socket | null;
  chatSocket: Socket | null;
  notificationSocket: Socket | null;
  isConnected: boolean;
  isGameConnected: boolean;
  onlineUsers: string[];
}

interface SocketActions {
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  gameEmit: (event: string, data?: unknown) => void;
  chatEmit: (event: string, data?: unknown) => void;
  notificationEmit: (event: string, data?: unknown) => void;
  notificationOn: (event: string, callback: SocketCallback) => void;
  notificationOff: (event: string, callback?: SocketCallback) => void;
  on: (event: string, callback: SocketCallback) => void;
  off: (event: string, callback?: SocketCallback) => void;
  gameOn: (event: string, callback: SocketCallback) => void;
  gameOff: (event: string, callback?: SocketCallback) => void;
  chatOn: (event: string, callback: SocketCallback) => void;
  chatOff: (event: string, callback?: SocketCallback) => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const socketOptions = (token: string) => ({
  auth: { token },
  transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

const attachStoredListeners = (
  socket: Socket,
  registry: Map<string, Set<SocketCallback>>
) => {
  Array.from(registry.entries()).forEach(([event, callbacks]) => {
    callbacks.forEach((callback) => {
      socket.on(event, callback);
    });
  });
};

export const useSocketStore = create<SocketState & SocketActions>()((set, get) => {
  const mainListeners = new Map<string, Set<SocketCallback>>();
  const gameListeners = new Map<string, Set<SocketCallback>>();
  const chatListeners = new Map<string, Set<SocketCallback>>();
  const notificationListeners = new Map<string, Set<SocketCallback>>();

  const registerListener = (
    registry: Map<string, Set<SocketCallback>>,
    event: string,
    callback: SocketCallback,
    socket: Socket | null
  ) => {
    if (!registry.has(event)) registry.set(event, new Set());
    registry.get(event)!.add(callback);
    socket?.on(event, callback);
  };

  const unregisterListener = (
    registry: Map<string, Set<SocketCallback>>,
    event: string,
    callback: SocketCallback | undefined,
    socket: Socket | null
  ) => {
    if (callback) {
      registry.get(event)?.delete(callback);
      socket?.off(event, callback);
    } else {
      registry.delete(event);
      socket?.off(event);
    }
  };

  return {
    socket: null,
    gameSocket: null,
    chatSocket: null,
    notificationSocket: null,
    isConnected: false,
    isGameConnected: false,
    onlineUsers: [],

    connect: (token: string) => {
      const { socket: existingMain, gameSocket: existingGame } = get();
      if (existingMain?.connected && existingGame?.connected) return;

      existingMain?.disconnect();
      existingGame?.disconnect();
      get().chatSocket?.disconnect();
      get().notificationSocket?.disconnect();

      const socket = io(SOCKET_URL, socketOptions(token));
      const gameSocket = io(`${SOCKET_URL}/game`, socketOptions(token));
      const chatSocket = io(`${SOCKET_URL}/chat`, socketOptions(token));
      const notificationSocket = io(`${SOCKET_URL}/notifications`, socketOptions(token));

      socket.on('connect', () => set({ isConnected: true }));
      socket.on('disconnect', () => set({ isConnected: false }));

      gameSocket.on('connect', () => {
        set({ isGameConnected: true });
        attachStoredListeners(gameSocket, gameListeners);
      });
      gameSocket.on('disconnect', () => set({ isGameConnected: false }));

      chatSocket.on('connect', () => {
        attachStoredListeners(chatSocket, chatListeners);
      });

      notificationSocket.on('connect', () => {
        attachStoredListeners(notificationSocket, notificationListeners);
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

      attachStoredListeners(socket, mainListeners);
      attachStoredListeners(gameSocket, gameListeners);
      attachStoredListeners(chatSocket, chatListeners);
      attachStoredListeners(notificationSocket, notificationListeners);

      set({ socket, gameSocket, chatSocket, notificationSocket });
    },

    disconnect: () => {
      const { socket, gameSocket, chatSocket, notificationSocket } = get();
      socket?.disconnect();
      gameSocket?.disconnect();
      chatSocket?.disconnect();
      notificationSocket?.disconnect();
      set({
        socket: null,
        gameSocket: null,
        chatSocket: null,
        notificationSocket: null,
        isConnected: false,
        isGameConnected: false,
        onlineUsers: [],
      });
    },

    emit: (event: string, data?: unknown) => {
      const socket = get().socket;
      if (socket?.connected) socket.emit(event, data);
    },

    gameEmit: (event: string, data?: unknown) => {
      const gameSocket = get().gameSocket;
      if (gameSocket?.connected) {
        gameSocket.emit(event, data);
      } else {
        console.warn('Game socket not connected, cannot emit:', event);
      }
    },

    chatEmit: (event: string, data?: unknown) => {
      const chatSocket = get().chatSocket;
      if (chatSocket?.connected) chatSocket.emit(event, data);
    },

    notificationEmit: (event: string, data?: unknown) => {
      const notificationSocket = get().notificationSocket;
      if (notificationSocket?.connected) notificationSocket.emit(event, data);
    },

    on: (event, callback) => {
      registerListener(mainListeners, event, callback, get().socket);
    },

    off: (event, callback) => {
      unregisterListener(mainListeners, event, callback, get().socket);
    },

    gameOn: (event, callback) => {
      registerListener(gameListeners, event, callback, get().gameSocket);
    },

    gameOff: (event, callback) => {
      unregisterListener(gameListeners, event, callback, get().gameSocket);
    },

    chatOn: (event, callback) => {
      registerListener(chatListeners, event, callback, get().chatSocket);
    },

    chatOff: (event, callback) => {
      unregisterListener(chatListeners, event, callback, get().chatSocket);
    },

    notificationOn: (event, callback) => {
      registerListener(notificationListeners, event, callback, get().notificationSocket);
    },

    notificationOff: (event, callback) => {
      unregisterListener(notificationListeners, event, callback, get().notificationSocket);
    },
  };
});
