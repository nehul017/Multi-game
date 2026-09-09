import { GameEngine } from './engine';

interface LudoToken {
  id: number;
  status: 'home' | 'active' | 'finished';
  stepsFromStart?: number;
}

interface LudoBoardPlayer {
  playerId: string;
  tokens: LudoToken[];
}

export const isBotPlayerId = (id: string): boolean => id.startsWith('bot:');

export const gameBotId = (gameType: string, roomId: string, seat = 0): string =>
  seat > 0 ? `bot:${gameType}:${roomId.slice(0, 8)}:${seat}` : `bot:${gameType}:${roomId.slice(0, 8)}`;

export const mindiBotId = (roomId: string, seat: number): string =>
  `bot:mindi:${roomId.slice(0, 8)}:${seat}`;

export const ludoBotId = (roomId: string): string => gameBotId('ludo', roomId);

export function pickLudoBotMove(engine: GameEngine, playerId: string): Record<string, unknown> | null {
  const moves = engine.getValidMoves(playerId);
  const board = engine.getGameState().board as {
    players?: LudoBoardPlayer[];
    hasRolled?: boolean;
    lastDice?: number;
  };
  const player = board.players?.find((entry) => entry.playerId === playerId);

  const roll = moves.find((move) => move.action === 'roll');
  if (roll) return roll;

  const tokenMoves = moves.filter((move) => move.action === 'move');
  if (tokenMoves.length) {
    const ranked = [...tokenMoves].sort((a, b) => {
      const tokenA = player?.tokens.find((token) => token.id === a.tokenId);
      const tokenB = player?.tokens.find((token) => token.id === b.tokenId);
      return scoreToken(tokenB) - scoreToken(tokenA);
    });
    return ranked[0] || tokenMoves[0];
  }

  if (moves[0]) return moves[0];

  if (!board.hasRolled) return { action: 'roll' };

  const homeToken = player?.tokens.find((token) => token.status === 'home');
  if (board.lastDice === 6 && homeToken) {
    return { action: 'move', tokenId: homeToken.id };
  }

  const activeToken = [...(player?.tokens || [])]
    .filter((token) => token.status === 'active')
    .sort((a, b) => (b.stepsFromStart ?? 0) - (a.stepsFromStart ?? 0))[0];
  if (activeToken) return { action: 'move', tokenId: activeToken.id };

  return null;
}

function scoreToken(token?: LudoToken): number {
  if (!token || token.status === 'finished') return -1;
  if (token.status === 'home') return 80;
  return 10 + (token.stepsFromStart ?? 0);
}
