import { TicTacToe } from '../../games/tic-tac-toe';
import { pickTicTacToeBotMove } from '../../games/tic-tac-toe-bot';

describe('Tic-Tac-Toe bot', () => {
  const human = 'p1';
  const bot = 'bot:tic-tac-toe:test';

  it('takes an immediate winning cell', () => {
    const game = new TicTacToe([bot, human]);
    game.makeMove(bot, { row: 0, col: 0 });
    game.makeMove(human, { row: 1, col: 0 });
    game.makeMove(bot, { row: 0, col: 1 });
    game.makeMove(human, { row: 1, col: 1 });

    const move = pickTicTacToeBotMove(game, bot);
    expect(move).toEqual({ row: 0, col: 2 });
  });

  it('blocks an opponent win on the next turn', () => {
    const game = new TicTacToe([human, bot]);
    game.makeMove(human, { row: 0, col: 0 });
    game.makeMove(bot, { row: 1, col: 1 });
    game.makeMove(human, { row: 0, col: 1 });

    const move = pickTicTacToeBotMove(game, bot);
    expect(move).toEqual({ row: 0, col: 2 });
  });

  it('prefers the center on an empty board', () => {
    const game = new TicTacToe([bot, human]);
    const move = pickTicTacToeBotMove(game, bot);
    expect(move).toEqual({ row: 1, col: 1 });
  });
});
