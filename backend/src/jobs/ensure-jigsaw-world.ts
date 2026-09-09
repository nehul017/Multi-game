import { Game } from '../models/game.model';

const JIGSAW_CATALOG = {
  name: 'Jigsaw World',
  slug: 'jigsaw-world',
  description: 'Play beautiful jigsaw puzzles online. Pick a picture, choose a cut, and snap every piece home.',
  minPlayers: 1,
  maxPlayers: 1,
  category: 'puzzle',
  isActive: true,
  settings: { puzzles: 8, difficulties: ['easy', 'medium', 'hard', 'expert'] },
  thumbnail: '/images/games/jigsaw-world.svg',
};

export const ensureJigsawWorldCatalog = async (): Promise<void> => {
  const existing = await Game.findOne({ slug: 'jigsaw-world' });
  if (existing) {
    existing.isActive = true;
    existing.minPlayers = 1;
    existing.maxPlayers = 1;
    await existing.save();
    return;
  }
  await Game.create(JIGSAW_CATALOG);
  console.log('Catalog game created: Jigsaw World');
};
