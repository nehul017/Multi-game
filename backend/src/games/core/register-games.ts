import { Chess } from '../chess';
import { ConnectFour } from '../connect-four';
import { Ludo } from '../ludo';
import { Mindi } from '../mindi';
import { QuizBattle } from '../quiz-battle';
import { SnakeMultiplayer } from '../snake-multiplayer';
import type { SnakeMatchSettings } from '../snake-types';
import { TicTacToe } from '../tic-tac-toe';
import type { MindiSettings } from '../mindi';
import { GAME_LIMITS } from './limits';
import { gameRegistry } from './registry';

let registered = false;

export const registerBuiltInGames = (): void => {
  if (registered) return;
  registered = true;

  gameRegistry.register({
    ...GAME_LIMITS['tic-tac-toe'],
    createEngine: (players) => new TicTacToe(players),
  });

  gameRegistry.register({
    ...GAME_LIMITS['connect-four'],
    createEngine: (players) => new ConnectFour(players),
  });

  gameRegistry.register({
    ...GAME_LIMITS.chess,
    createEngine: (players) => new Chess(players),
  });

  gameRegistry.register({
    ...GAME_LIMITS.ludo,
    createEngine: (players) => new Ludo(players),
  });

  gameRegistry.register({
    ...GAME_LIMITS['quiz-battle'],
    createEngine: (players) => new QuizBattle(players),
  });

  gameRegistry.register({
    ...GAME_LIMITS['snake-multiplayer'],
    createEngine: (players, settings) => new SnakeMultiplayer(players, (settings || {}) as SnakeMatchSettings),
  });
  gameRegistry.alias('coil-rush', 'snake-multiplayer');

  gameRegistry.register({
    ...GAME_LIMITS.mindi,
    createEngine: (players, settings) => new Mindi(players, (settings || {}) as MindiSettings),
  });

  gameRegistry.register(GAME_LIMITS['classic-fruit-slots']);
  gameRegistry.register(GAME_LIMITS.poker);
  gameRegistry.register(GAME_LIMITS['block-master']);
  gameRegistry.register(GAME_LIMITS['puzzle-world']);
  gameRegistry.register(GAME_LIMITS['jigsaw-world']);
};
