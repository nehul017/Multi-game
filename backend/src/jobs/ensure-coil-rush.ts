import { Game } from '../models/game.model';

const COIL_RUSH_CATALOG = {
  name: 'Coil Rush',
  slug: 'snake-multiplayer',
  description: 'Grow your coil, outsmart rivals, and survive the arena.',
  minPlayers: 1,
  maxPlayers: 50,
  category: 'arcade',
  isActive: true,
  settings: {
    worldSize: 3200,
    tickRate: 50,
    maxPlayers: 50,
    modes: ['classic', 'time-rush', 'battle'],
  },
  thumbnail: '/images/games/snake.jpg',
};

export const ensureCoilRushCatalog = async (): Promise<void> => {
  const existing = await Game.findOne({ slug: 'snake-multiplayer' });
  if (existing) {
    existing.isActive = true;
    existing.name = 'Coil Rush';
    existing.description = COIL_RUSH_CATALOG.description;
    existing.minPlayers = 1;
    existing.maxPlayers = 50;
    existing.category = 'arcade';
    existing.settings = { ...(existing.settings || {}), ...COIL_RUSH_CATALOG.settings };
    await existing.save();
    return;
  }
  await Game.create(COIL_RUSH_CATALOG);
  console.log('Catalog game created: Coil Rush');
};
