import type { ChessEnginePort, EngineEval, MoveAnnotation } from '../types';

/** Integration point for Stockfish (or another UCI engine). No fake scores. */
export class UnavailableChessEngine implements ChessEnginePort {
  isAvailable() {
    return false;
  }

  async evaluate(): Promise<EngineEval | null> {
    return null;
  }

  async bestMove(): Promise<string | null> {
    return null;
  }

  terminate() {}
}

export const chessEnginePort: ChessEnginePort = new UnavailableChessEngine();

export function annotateMoves(_pgn: string, engine: ChessEnginePort): Promise<MoveAnnotation[]> {
  if (!engine.isAvailable()) return Promise.resolve([]);
  return Promise.resolve([]);
}
