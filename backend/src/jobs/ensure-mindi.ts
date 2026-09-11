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
  thumbnail: '/images/games/mindi.jpg',
};

const CARROM_CATALOG = {
  name: 'Carrom Classic',
  slug: 'carrom',
  description: 'Premium 2-player carrom. Aim, strike, cover the queen, and play to 5 points.',
  minPlayers: 2,
  maxPlayers: 2,
  category: 'arcade',
  isActive: true,
  settings: { pointsToWin: 5, variant: 'standard' },
  thumbnail: '/images/games/carrom.jpg',
};

export const ensureCarromCatalog = async (): Promise<void> => {
  const existing = await Game.findOne({ slug: 'carrom' });
  if (existing) {
    existing.isActive = true;
    existing.minPlayers = 2;
    existing.maxPlayers = 2;
    existing.name = CARROM_CATALOG.name;
    existing.description = CARROM_CATALOG.description;
    existing.category = CARROM_CATALOG.category;
    existing.thumbnail = CARROM_CATALOG.thumbnail;
    existing.settings = { ...(existing.settings || {}), ...CARROM_CATALOG.settings };
    await existing.save();
    return;
  }
  await Game.create(CARROM_CATALOG);
  console.log('Catalog game created: Carrom Classic');
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
