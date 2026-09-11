import { CARROM_BOARD, CARROM_QUEEN_POINTS } from './constants';
import { defaultStrikerPosition } from './layout';
import type {
  CarromBoardState,
  CarromColor,
  CarromFoulKind,
  CarromPiece,
  CarromShotResult,
} from './types';

export const opponentColor = (color: CarromColor): CarromColor =>
  color === 'white' ? 'black' : 'white';

export const remainingOf = (pieces: CarromPiece[], kind: 'white' | 'black'): number =>
  pieces.filter((piece) => piece.kind === kind && !piece.pocketed).length;

export const pocketedOf = (pieces: CarromPiece[], kind: 'white' | 'black' | 'queen'): number =>
  pieces.filter((piece) => piece.kind === kind && piece.pocketed).length;

const findOpenSpace = (pieces: CarromPiece[]): { x: number; y: number } => {
  const center = CARROM_BOARD / 2;
  const candidates = [
    { x: center, y: center },
    { x: center + 46, y: center },
    { x: center - 46, y: center },
    { x: center, y: center + 46 },
    { x: center, y: center - 46 },
    { x: center + 38, y: center + 38 },
    { x: center - 38, y: center - 38 },
  ];
  for (const spot of candidates) {
    const blocked = pieces.some((piece) => {
      if (piece.pocketed || piece.kind === 'striker') return false;
      return Math.hypot(piece.x - spot.x, piece.y - spot.y) < 44;
    });
    if (!blocked) return spot;
  }
  return { x: center, y: center };
};

export const returnPieceToBoard = (pieces: CarromPiece[], piece: CarromPiece): void => {
  const spot = findOpenSpace(pieces);
  piece.pocketed = false;
  piece.vx = 0;
  piece.vy = 0;
  piece.x = spot.x;
  piece.y = spot.y;
};

export const resetStriker = (pieces: CarromPiece[], color: CarromColor): void => {
  const striker = pieces.find((piece) => piece.kind === 'striker');
  if (!striker) return;
  const pos = defaultStrikerPosition(color);
  striker.pocketed = false;
  striker.vx = 0;
  striker.vy = 0;
  striker.x = pos.x;
  striker.y = pos.y;
};

export const syncPocketCounts = (board: CarromBoardState): void => {
  board.pocketedCounts = {
    white: pocketedOf(board.pieces, 'white'),
    black: pocketedOf(board.pieces, 'black'),
    queen: board.pieces.some((piece) => piece.kind === 'queen' && piece.pocketed),
  };
};

export const dueCoinFor = (board: CarromBoardState, color: CarromColor): CarromPiece | null => {
  const due = [...board.pieces]
    .reverse()
    .find((piece) => piece.kind === color && piece.pocketed);
  return due || null;
};

export interface ResolvedBoard {
  board: CarromBoardState;
  result: CarromShotResult;
  matchWinner: string | null;
}

export const resolveAfterShot = (
  board: CarromBoardState,
  playerId: string,
  simulated: {
    pieces: CarromPiece[];
    events: CarromShotResult['events'];
    durationMs: number;
    pocketedIds: string[];
    input: CarromShotResult['input'];
  }
): ResolvedBoard => {
  const color = board.colors[playerId] || 'white';
  const next: CarromBoardState = {
    ...board,
    pieces: simulated.pieces,
    lastShot: null,
    foul: null,
    foulMessage: null,
  };

  const pocketed = simulated.pieces.filter(
    (piece) => simulated.pocketedIds.includes(piece.id) && piece.kind !== 'striker'
  );
  const strikerPocketed = simulated.pieces.some(
    (piece) => piece.kind === 'striker' && simulated.pocketedIds.includes(piece.id)
  );
  const ownPocketed = pocketed.filter((piece) => piece.kind === color);
  const queenPocketed = pocketed.some((piece) => piece.kind === 'queen');

  let foul: CarromFoulKind = null;
  let foulMessage: string | null = null;
  let turnKept = false;
  let boardWonBy: string | null = null;

  if (strikerPocketed) {
    foul = 'striker-pocketed';
    foulMessage = 'Foul — striker pocketed';
    for (const piece of ownPocketed) returnPieceToBoard(next.pieces, piece);
    if (queenPocketed) {
      const queen = next.pieces.find((piece) => piece.kind === 'queen');
      if (queen) returnPieceToBoard(next.pieces, queen);
      if (next.queenPendingFor === playerId) {
        next.queenStatus = next.queenCoveredBy ? 'covered' : 'on-board';
        next.queenPendingFor = null;
      }
    }
    const due = dueCoinFor(next, color);
    if (due) returnPieceToBoard(next.pieces, due);
  } else {
    if (queenPocketed) {
      next.queenStatus = 'pending-cover';
      next.queenPendingFor = playerId;
    }

    if (ownPocketed.length > 0 && next.queenPendingFor === playerId) {
      next.queenStatus = 'covered';
      next.queenCoveredBy = playerId;
      next.queenPendingFor = null;
    }

    const ownLeft = remainingOf(next.pieces, color);
    if (ownLeft === 0) {
      const covered = next.queenCoveredBy === playerId || next.queenStatus === 'covered';
      if (covered && next.queenCoveredBy === playerId) {
        boardWonBy = playerId;
      } else if (!covered) {
        foul = 'last-coin-before-queen';
        foulMessage = 'Foul — cover the queen first';
        const last = ownPocketed[ownPocketed.length - 1];
        if (last) returnPieceToBoard(next.pieces, last);
        if (queenPocketed) {
          const queen = next.pieces.find((piece) => piece.kind === 'queen');
          if (queen) returnPieceToBoard(next.pieces, queen);
          next.queenStatus = next.queenCoveredBy ? 'covered' : 'on-board';
          next.queenPendingFor = null;
        }
      } else {
        boardWonBy = playerId;
      }
    }

    if (!foul && ownPocketed.length > 0) {
      turnKept = true;
    }
  }

  if (!turnKept && next.queenPendingFor === playerId && !boardWonBy) {
    const queen = next.pieces.find((piece) => piece.kind === 'queen');
    if (queen?.pocketed) returnPieceToBoard(next.pieces, queen);
    next.queenStatus = next.queenCoveredBy ? 'covered' : 'on-board';
    next.queenPendingFor = null;
    if (!foulMessage && queenPocketed) {
      foulMessage = 'Queen not covered';
    }
  }

  syncPocketCounts(next);
  resetStriker(next.pieces, turnKept ? color : opponentColor(color));

  if (boardWonBy) {
    const oppLeft = remainingOf(next.pieces, opponentColor(color));
    let award = oppLeft;
    if (next.queenCoveredBy === boardWonBy) award += CARROM_QUEEN_POINTS;
    next.scores[boardWonBy] = (next.scores[boardWonBy] || 0) + Math.max(1, award);
    next.phase = next.scores[boardWonBy] >= next.pointsToWin ? 'match-complete' : 'board-complete';
    next.statusMessage =
      next.phase === 'match-complete' ? 'Match complete' : 'Board complete';
  } else {
    next.phase = 'aiming';
    next.statusMessage = foulMessage || (turnKept ? 'Continue your turn' : 'Turn changed');
  }

  next.foul = foul;
  next.foulMessage = foulMessage;

  const result: CarromShotResult = {
    shotId: simulated.input.shotId,
    playerId,
    input: simulated.input,
    events: simulated.events,
    durationMs: simulated.durationMs,
    pocketedIds: simulated.pocketedIds,
    foul,
    foulMessage,
    turnKept,
    boardWonBy,
  };
  next.lastShot = result;

  let matchWinner: string | null = null;
  if (next.phase === 'match-complete') {
    matchWinner = boardWonBy;
  }

  return { board: next, result, matchWinner };
};
