import { Game } from '../models/game.model';

const BOTTLE_SHOOTER_CATALOG = {
  name: 'Bottle Shooter 3D',
  slug: 'bottle-shooter-3d',
  description: 'Take aim, break glass, and master every shot.',
  minPlayers: 1,
  maxPlayers: 1,
  category: 'shooter',
  isActive: true,
  settings: { levels: 8, difficulty: 'medium' },
  thumbnail: '/images/games/bottle-shooter-3d.svg',
};

export const ensureBottleShooterCatalog = async (): Promise<void> => {
  const existing = await Game.findOne({ slug: 'bottle-shooter-3d' });
  if (existing) {
    existing.isActive = true;
    existing.minPlayers = 1;
    existing.maxPlayers = 1;
    existing.name = BOTTLE_SHOOTER_CATALOG.name;
    existing.description = BOTTLE_SHOOTER_CATALOG.description;
    existing.category = BOTTLE_SHOOTER_CATALOG.category;
    existing.thumbnail = BOTTLE_SHOOTER_CATALOG.thumbnail;
    await existing.save();
    return;
  }
  await Game.create(BOTTLE_SHOOTER_CATALOG);
  console.log('Catalog game created: Bottle Shooter 3D');
};
