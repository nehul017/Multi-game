import { ConnectFour } from '../../games/connect-four';
import { pickConnectFourBotMove } from '../../games/connect-four-bot';

describe('Connect Four bot', () => {
  const human = 'p1';
  const bot = 'bot:connect-four:test';

  it('takes an immediate winning column', () => {
    const game = new ConnectFour([human, bot]);
    game.makeMove(human, { col: 6 });
    game.makeMove(bot, { col: 0 });
    game.makeMove(human, { col: 6 });
    game.makeMove(bot, { col: 1 });
    game.makeMove(human, { col: 6 });
    game.makeMove(bot, { col: 2 });
    game.makeMove(human, { col: 5 });

    const move = pickConnectFourBotMove(game, bot);
    expect(move).toEqual({ col: 3 });
  });

  it('blocks an opponent win on the next turn', () => {
    const game = new ConnectFour([human, bot]);
    game.makeMove(human, { col: 0 });
    game.makeMove(bot, { col: 6 });
    game.makeMove(human, { col: 1 });
    game.makeMove(bot, { col: 6 });
    game.makeMove(human, { col: 2 });

    const move = pickConnectFourBotMove(game, bot);
    expect(move).toEqual({ col: 3 });
  });

  it('prefers a legal center column on an empty board', () => {
    const game = new ConnectFour([bot, human]);
    const move = pickConnectFourBotMove(game, bot);
    expect(move).toEqual({ col: 3 });
  });
});
