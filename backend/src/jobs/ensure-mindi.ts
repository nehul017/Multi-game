import { Game } from '../models/game.model';

const MINDI_CATALOG = {
  name: 'Mindi Cot',
  slug: 'mindi',
  description:
    'Classic 4-player partnership card game. Capture tens with your partner, follow suit, and play the trump.',
  minPlayers: 4,
  maxPlayers: 4,
  category: 'strategy',
  isActive: true,
  settings: {
    seats: 4,
    botDifficulty: 'medium',
    trumpMode: 'dealer-last-card-shown',
    tensToWin: 3,
  },
  thumbnail: '/images/games/mindi.svg',
};

export const ensureMindiCatalog = async (): Promise<void> => {
  const existing = await Game.findOne({ slug: 'mindi' });
  if (existing) {
    existing.isActive = true;
    existing.minPlayers = 4;
    existing.maxPlayers = 4;
    await existing.save();
    return;
  }
  await Game.create(MINDI_CATALOG);
  console.log('Catalog game created: Mindi Cot');
};
