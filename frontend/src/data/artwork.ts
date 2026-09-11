export const GAME_ARTWORK: Record<string, string> = {
  chess: '/images/games/chess.jpg',
  'tic-tac-toe': '/images/games/tic-tac-toe.jpg',
  'connect-four': '/images/games/connect-four.jpg',
  'snake-multiplayer': '/images/games/snake.jpg',
  'coil-rush': '/images/games/snake.jpg',
  ludo: '/images/games/ludo.jpg',
  'quiz-battle': '/images/games/quiz.jpg',
  'cyber-strike': '/images/games/cyber-strike.jpg',
  'battle-arena': '/images/games/battle-arena.jpg',
  'shadow-warriors': '/images/games/shadow-warriors.jpg',
  'zombie-survival': '/images/games/zombie-survival.jpg',
  'warzone-legends': '/images/games/warzone-legends.jpg',
  'mystic-valley': '/images/games/mystic-valley.jpg',
  'lost-kingdom': '/images/games/lost-kingdom.jpg',
  'island-explorer': '/images/games/island-explorer.jpg',
  'dragon-quest': '/images/games/dragon-quest.jpg',
  'neon-racers': '/images/games/neon-racers.jpg',
  'street-velocity': '/images/games/street-velocity.jpg',
  'turbo-legends': '/images/games/turbo-legends.jpg',
  'drift-masters': '/images/games/drift-masters.jpg',
  'shadow-quest': '/images/games/shadow-quest.jpg',
  'legend-of-heroes': '/images/games/legend-of-heroes.jpg',
  'dragon-realms': '/images/games/dragon-realms.jpg',
  'dark-kingdom': '/images/games/dark-kingdom.jpg',
  'galaxy-warriors': '/images/games/galaxy-warriors.jpg',
  'cyber-assault': '/images/games/cyber-assault.jpg',
  'space-force': '/images/games/space-force.jpg',
  'battle-front': '/images/games/battle-front.jpg',
  'empire-wars': '/images/games/empire-wars.jpg',
  'battle-tactics': '/images/games/battle-tactics.jpg',
  'kingdom-clash': '/images/games/kingdom-clash.jpg',
  'war-command': '/images/games/war-command.jpg',
  'football-legends': '/images/games/football-legends.jpg',
  'basketball-pro': '/images/games/basketball-pro.jpg',
  'tennis-champions': '/images/games/tennis-champions.jpg',
  'street-cricket': '/images/games/street-cricket.jpg',
  'puzzle-world': '/images/games/puzzle-world.jpg',
  'block-master': '/images/games/block-master.jpg',
  'classic-fruit-slots': '/images/games/classic-fruit-slots.jpg',
  poker: '/images/games/poker.jpg',
  mindi: '/images/games/mindi.jpg',
  'jigsaw-world': '/images/games/jigsaw-world.jpg',
  'bottle-shooter-3d': '/images/games/bottle-shooter-3d.jpg',
  carrom: '/images/games/carrom.jpg',
  'brain-challenge': '/images/games/brain-challenge.jpg',
  'color-quest': '/images/games/color-quest.jpg',
  'pixel-builder': '/images/games/pixel-builder.jpg',
  'city-builder': '/images/games/city-builder.jpg',
  'farm-life': '/images/games/farm-life.jpg',
  'airport-manager': '/images/games/airport-manager.jpg',
};

export const CATEGORY_ARTWORK: Record<string, string> = {
  all: '/images/hero/featured.jpg',
  action: '/images/games/cyber-strike.jpg',
  adventure: '/images/games/mystic-valley.jpg',
  racing: '/images/games/neon-racers.jpg',
  rpg: '/images/games/shadow-quest.jpg',
  strategy: '/images/games/empire-wars.jpg',
  shooter: '/images/games/galaxy-warriors.jpg',
  sports: '/images/games/football-legends.jpg',
  puzzle: '/images/games/puzzle-world.jpg',
  simulation: '/images/games/city-builder.jpg',
  arcade: '/images/games/snake.jpg',
  multiplayer: '/images/hero/multiplayer.jpg',
};

export const HERO_ARTWORK = '/images/games/cyber-strike.jpg';
export const MULTIPLAYER_ARTWORK = '/images/hero/multiplayer.jpg';
export const FALLBACK_ARTWORK = '/images/games/fallback.svg';

export function artworkForSlug(slug: string): string {
  return GAME_ARTWORK[slug] || FALLBACK_ARTWORK;
}

export function categoryArtwork(id: string): string {
  return CATEGORY_ARTWORK[id] || FALLBACK_ARTWORK;
}

export function isUsableImageSrc(src?: string): src is string {
  if (!src) return false;
  return (
    src.startsWith('/') ||
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:')
  );
}

export function resolveGameImage(slug: string, thumbnail?: string): string {
  if (GAME_ARTWORK[slug]) return GAME_ARTWORK[slug];
  if (isUsableImageSrc(thumbnail) && !thumbnail.endsWith('.png')) return thumbnail;
  if (isUsableImageSrc(thumbnail) && thumbnail.startsWith('http')) return thumbnail;
  return FALLBACK_ARTWORK;
}
