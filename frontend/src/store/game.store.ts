import { create } from 'zustand';
import { Room, GameState, RoomPlayer, Move } from '@/types';

interface GameStoreState {
  currentRoom: Room | null;
  gameState: GameState | null;
  players: RoomPlayer[];
  spectators: string[];
  isPlaying: boolean;
  countdown: number | null;
  moveHistory: Move[];
  isMatchmaking: boolean;
  matchmakingTime: number;
}

interface GameStoreActions {
  setRoom: (room: Room | null) => void;
  setGameState: (state: GameState | null) => void;
  setPlayers: (players: RoomPlayer[]) => void;
  addSpectator: (userId: string) => void;
  removeSpectator: (userId: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setCountdown: (count: number | null) => void;
  addMove: (move: Move) => void;
  clearMoves: () => void;
  setMatchmaking: (status: boolean) => void;
  setMatchmakingTime: (time: number) => void;
  resetGame: () => void;
  playerReady: (userId: string) => void;
}

export const useGameStore = create<GameStoreState & GameStoreActions>()((set, get) => ({
  currentRoom: null,
  gameState: null,
  players: [],
  spectators: [],
  isPlaying: false,
  countdown: null,
  moveHistory: [],
  isMatchmaking: false,
  matchmakingTime: 0,

  setRoom: (room) => set({ currentRoom: room }),

  setGameState: (state) => set({ gameState: state }),

  setPlayers: (players) => set({ players }),

  addSpectator: (userId) =>
    set((state) => ({
      spectators: [...state.spectators, userId],
    })),

  removeSpectator: (userId) =>
    set((state) => ({
      spectators: state.spectators.filter((id) => id !== userId),
    })),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCountdown: (count) => set({ countdown: count }),

  addMove: (move) =>
    set((state) => ({
      moveHistory: [...state.moveHistory, move],
    })),

  clearMoves: () => set({ moveHistory: [] }),

  setMatchmaking: (status) => set({ isMatchmaking: status }),

  setMatchmakingTime: (time) => set({ matchmakingTime: time }),

  resetGame: () =>
    set({
      currentRoom: null,
      gameState: null,
      players: [],
      spectators: [],
      isPlaying: false,
      countdown: null,
      moveHistory: [],
      isMatchmaking: false,
      matchmakingTime: 0,
    }),

  playerReady: (userId) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.userId === userId ? { ...p, isReady: true } : p
      ),
    })),
}));
