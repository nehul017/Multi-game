import { GAME_ARTWORK, HERO_ARTWORK } from '@/data/artwork';
import type {
  FeaturedGame,
  GameArtTone,
  HomeCategory,
  HomeCategoryId,
  LibraryCategory,
  LibraryCategoryId,
  HomeData,
  HomeGame,
  HomeGameCategoryId,
  HomeLeaderboardEntry,
  HomeSearchFilter,
  HomeTournament,
  RecentGame,
} from '@/types/home';

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'all', label: 'All Games', icon: '🎮', tone: 'violet' },
  { id: 'action', label: 'Action', icon: '🔥', tone: 'crimson' },
  { id: 'adventure', label: 'Adventure', icon: '🗺️', tone: 'forest' },
  { id: 'racing', label: 'Racing', icon: '🏎️', tone: 'racing' },
  { id: 'rpg', label: 'RPG', icon: '⚔️', tone: 'ember' },
  { id: 'strategy', label: 'Strategy', icon: '♟️', tone: 'frost' },
  { id: 'shooter', label: 'Shooter', icon: '🎯', tone: 'galaxy' },
  { id: 'sports', label: 'Sports', icon: '⚽', tone: 'arena' },
  { id: 'puzzle', label: 'Puzzle', icon: '🧩', tone: 'cyber' },
  { id: 'simulation', label: 'Simulation', icon: '🏗️', tone: 'shadow' },
  { id: 'arcade', label: 'Arcade', icon: '👾', tone: 'cyber' },
  { id: 'multiplayer', label: 'Multiplayer', icon: '👥', tone: 'arena' },
];

interface CatalogDraft {
  name: string;
  genres: string[];
  category: HomeGameCategoryId;
  description: string;
  rating: number;
  onlinePlayers: number;
  plays: number;
  artTone: GameArtTone;
  slug?: string;
  id?: string;
  image?: string;
  isNew?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  isMultiplayer?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
  playable?: boolean;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function catalogGame(draft: CatalogDraft): HomeGame {
  const slug = draft.slug || toSlug(draft.name);
  const isMultiplayer = Boolean(draft.isMultiplayer || draft.genres.includes('Multiplayer'));

  return {
    id: draft.id || slug,
    slug,
    name: draft.name,
    description: draft.description,
    genre: draft.genres.join(' / '),
    genres: draft.genres,
    category: draft.category,
    rating: draft.rating,
    onlinePlayers: draft.onlinePlayers,
    plays: draft.plays,
    image: draft.image || GAME_ARTWORK[slug],
    artTone: draft.artTone,
    isNew: draft.isNew,
    isTrending: draft.isTrending,
    isFeatured: draft.isFeatured,
    isMultiplayer,
    minPlayers: draft.minPlayers,
    maxPlayers: draft.maxPlayers,
    tags: draft.genres,
    playable: Boolean(draft.playable),
  };
}

export const HOME_GAMES: HomeGame[] = [
  catalogGame({
    id: 'chess',
    slug: 'chess',
    name: 'Chess',
    description: 'The classic mind sport, rebuilt for ranked play. Outthink opponents, watch the clock, and climb the board.',
    genres: ['Strategy', 'Multiplayer'],
    category: 'strategy',
    rating: 4.9,
    onlinePlayers: 1860,
    plays: 12480,
    image: GAME_ARTWORK.chess,
    artTone: 'ember',
    isFeatured: false,
    isTrending: true,
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2,
    playable: true,
  }),
  catalogGame({
    id: 'snake-multiplayer',
    slug: 'snake-multiplayer',
    name: 'Coil Rush',
    description: 'Original slither battle. Steer with the mouse, boost, eat pellets, and cut rival coils off in a live arena.',
    genres: ['Arcade', 'Action', 'Multiplayer'],
    category: 'arcade',
    rating: 4.7,
    onlinePlayers: 2400,
    plays: 9860,
    image: GAME_ARTWORK['snake-multiplayer'],
    artTone: 'cyber',
    isTrending: true,
    isNew: true,
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 4,
    playable: true,
  }),
  catalogGame({
    id: 'ludo',
    slug: 'ludo',
    name: 'Ludo',
    description: 'Race your tokens home in a modern multiplayer classic for 2-4 players.',
    genres: ['Arcade', 'Multiplayer'],
    category: 'arcade',
    rating: 4.5,
    onlinePlayers: 1120,
    plays: 7420,
    image: GAME_ARTWORK.ludo,
    artTone: 'forest',
    isTrending: true,
    isNew: true,
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 4,
    playable: true,
  }),
  catalogGame({
    id: 'quiz-battle',
    slug: 'quiz-battle',
    name: 'Quiz Battle',
    description: 'Rapid-fire trivia battles. Answer fast, climb the room, and outscore the lobby.',
    genres: ['Puzzle', 'Multiplayer'],
    category: 'puzzle',
    rating: 4.6,
    onlinePlayers: 740,
    plays: 5310,
    image: GAME_ARTWORK['quiz-battle'],
    artTone: 'violet',
    isTrending: true,
    isNew: true,
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 8,
    playable: true,
  }),
  catalogGame({
    id: 'connect-four',
    slug: 'connect-four',
    name: 'Connect Four',
    description: 'Drop, block, and connect four under pressure in this ranked duel.',
    genres: ['Puzzle', 'Strategy'],
    category: 'puzzle',
    rating: 4.4,
    onlinePlayers: 640,
    plays: 6180,
    image: GAME_ARTWORK['connect-four'],
    artTone: 'racing',
    isTrending: true,
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2,
    playable: true,
  }),
  catalogGame({
    id: 'tic-tac-toe',
    slug: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'A sharper, ranked take on the original grid duel. Get three in a row.',
    genres: ['Puzzle', 'Strategy'],
    category: 'puzzle',
    rating: 4.3,
    onlinePlayers: 520,
    plays: 8940,
    image: GAME_ARTWORK['tic-tac-toe'],
    artTone: 'frost',
    isNew: true,
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2,
    playable: true,
  }),
  catalogGame({
    id: 'block-master',
    slug: 'block-master',
    name: 'Block Master',
    description: 'Stack, rotate, and clear under rising pressure.',
    genres: ['Puzzle', 'Arcade'],
    category: 'puzzle',
    rating: 4.6,
    onlinePlayers: 0,
    plays: 7460,
    image: GAME_ARTWORK['block-master'],
    artTone: 'cyber',
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    playable: true,
  }),
  catalogGame({
    id: 'classic-fruit-slots',
    slug: 'classic-fruit-slots',
    name: 'Classic Fruit Slots',
    description: 'A classic 5-reel fruit slot machine. Spin cherries, bells, and lucky sevens for line wins.',
    genres: ['Arcade', 'Casino'],
    category: 'arcade',
    rating: 4.8,
    onlinePlayers: 0,
    plays: 0,
    image: GAME_ARTWORK['classic-fruit-slots'],
    artTone: 'ember',
    isNew: true,
    isTrending: true,
    isMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    playable: true,
  }),
  catalogGame({
    name: 'Cyber Strike',
    genres: ['Action', 'Multiplayer'],
    category: 'action',
    description: 'Breach neon megacities in fast tactical raids with live squads.',
    rating: 4.8,
    onlinePlayers: 3240,
    plays: 18420,
    artTone: 'crimson',
    isFeatured: true,
    isTrending: true,
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 8,
  }),
  catalogGame({
    name: 'Battle Arena',
    genres: ['Action', 'Strategy'],
    category: 'action',
    description: 'Read the field, time your strike, and outplay rivals in a live arena.',
    rating: 4.7,
    onlinePlayers: 2140,
    plays: 14280,
    artTone: 'arena',
    isTrending: true,
  }),
  catalogGame({
    name: 'Shadow Warriors',
    genres: ['Action'],
    category: 'action',
    description: 'Silent takedowns and close-quarters combat across a city of shadows.',
    rating: 4.5,
    onlinePlayers: 980,
    plays: 8940,
    artTone: 'shadow',
  }),
  catalogGame({
    name: 'Zombie Survival',
    genres: ['Action', 'Survival'],
    category: 'action',
    description: 'Scavenge, fortify, and last the night against endless hordes.',
    rating: 4.6,
    onlinePlayers: 1560,
    plays: 11240,
    artTone: 'crimson',
    isNew: true,
  }),
  catalogGame({
    name: 'Warzone Legends',
    genres: ['Action', 'Shooter'],
    category: 'action',
    description: 'Large-scale firefights where positioning and loadouts decide the round.',
    rating: 4.7,
    onlinePlayers: 2410,
    plays: 15680,
    artTone: 'galaxy',
    isTrending: true,
  }),
  catalogGame({
    name: 'Mystic Valley',
    genres: ['Adventure'],
    category: 'adventure',
    description: 'Wander luminous wilds, uncover ruins, and follow the valley’s secrets.',
    rating: 4.6,
    onlinePlayers: 720,
    plays: 6420,
    artTone: 'forest',
  }),
  catalogGame({
    name: 'Lost Kingdom',
    genres: ['Adventure', 'RPG'],
    category: 'adventure',
    description: 'Restore a forgotten realm through exploration, quests, and alliances.',
    rating: 4.8,
    onlinePlayers: 1100,
    plays: 9840,
    artTone: 'ember',
    isTrending: true,
  }),
  catalogGame({
    name: 'Island Explorer',
    genres: ['Adventure'],
    category: 'adventure',
    description: 'Chart unmapped islands, gather relics, and survive shifting tides.',
    rating: 4.4,
    onlinePlayers: 540,
    plays: 4210,
    artTone: 'cyber',
    isNew: true,
  }),
  catalogGame({
    name: 'Dragon Quest',
    genres: ['Adventure', 'RPG'],
    category: 'adventure',
    description: 'A legendary journey across kingdoms threatened by ancient dragons.',
    rating: 4.9,
    onlinePlayers: 1800,
    plays: 22140,
    artTone: 'ember',
    isTrending: true,
  }),
  catalogGame({
    name: 'Neon Racers',
    genres: ['Racing'],
    category: 'racing',
    description: 'Night circuits, nitro lines, and razor-thin finishes in a neon city.',
    rating: 4.7,
    onlinePlayers: 1920,
    plays: 13460,
    artTone: 'racing',
    isTrending: true,
    isNew: true,
  }),
  catalogGame({
    name: 'Street Velocity',
    genres: ['Racing'],
    category: 'racing',
    description: 'Illegal midnight runs through tight streets and wet asphalt.',
    rating: 4.5,
    onlinePlayers: 860,
    plays: 7840,
    artTone: 'crimson',
  }),
  catalogGame({
    name: 'Turbo Legends',
    genres: ['Racing'],
    category: 'racing',
    description: 'Classic machines, modern handling, and championship-grade rivalries.',
    rating: 4.6,
    onlinePlayers: 1020,
    plays: 9120,
    artTone: 'racing',
  }),
  catalogGame({
    name: 'Drift Masters',
    genres: ['Racing'],
    category: 'racing',
    description: 'Hold the slide, score the line, and own every hairpin.',
    rating: 4.4,
    onlinePlayers: 640,
    plays: 5340,
    artTone: 'arena',
    isNew: true,
  }),
  catalogGame({
    name: 'Shadow Quest',
    genres: ['RPG'],
    category: 'rpg',
    description: 'Forge a hero, hunt relics, and unravel a conspiracy in the dark.',
    rating: 4.8,
    onlinePlayers: 1480,
    plays: 16720,
    artTone: 'shadow',
    isTrending: true,
  }),
  catalogGame({
    name: 'Legend of Heroes',
    genres: ['RPG'],
    category: 'rpg',
    description: 'Party-based battles and branching stories across a living continent.',
    rating: 4.7,
    onlinePlayers: 920,
    plays: 10480,
    artTone: 'ember',
  }),
  catalogGame({
    name: 'Dragon Realms',
    genres: ['RPG'],
    category: 'rpg',
    description: 'Raise a dragon companion and carve a path through rival clans.',
    rating: 4.6,
    onlinePlayers: 880,
    plays: 8740,
    artTone: 'crimson',
  }),
  catalogGame({
    name: 'Dark Kingdom',
    genres: ['RPG', 'Adventure'],
    category: 'rpg',
    description: 'Reclaim a cursed throne through dungeon delves and hard choices.',
    rating: 4.5,
    onlinePlayers: 760,
    plays: 6930,
    artTone: 'shadow',
    isNew: true,
  }),
  catalogGame({
    name: 'Galaxy Warriors',
    genres: ['Shooter'],
    category: 'shooter',
    description: 'Orbital dogfights and boarding raids across a fractured galaxy.',
    rating: 4.7,
    onlinePlayers: 2210,
    plays: 14860,
    artTone: 'galaxy',
    isTrending: true,
  }),
  catalogGame({
    name: 'Cyber Assault',
    genres: ['Shooter', 'Multiplayer'],
    category: 'shooter',
    description: 'Objective-based firefights in a rain-soaked cyber district.',
    rating: 4.8,
    onlinePlayers: 2840,
    plays: 17240,
    artTone: 'cyber',
    isTrending: true,
    isNew: true,
    isMultiplayer: true,
    minPlayers: 4,
    maxPlayers: 12,
  }),
  catalogGame({
    name: 'Space Force',
    genres: ['Shooter'],
    category: 'shooter',
    description: 'Zero-g combat, breach charges, and precision orbital strikes.',
    rating: 4.5,
    onlinePlayers: 940,
    plays: 8120,
    artTone: 'frost',
  }),
  catalogGame({
    name: 'Battle Front',
    genres: ['Shooter'],
    category: 'shooter',
    description: 'Frontline warfare with vehicles, squads, and shifting objectives.',
    rating: 4.6,
    onlinePlayers: 1180,
    plays: 9640,
    artTone: 'arena',
  }),
  catalogGame({
    name: 'Empire Wars',
    genres: ['Strategy'],
    category: 'strategy',
    description: 'Expand your empire, manage supply lines, and win the long war.',
    rating: 4.7,
    onlinePlayers: 1320,
    plays: 11940,
    artTone: 'ember',
    isTrending: true,
  }),
  catalogGame({
    name: 'Battle Tactics',
    genres: ['Strategy'],
    category: 'strategy',
    description: 'Turn-based campaigns where every unit placement matters.',
    rating: 4.5,
    onlinePlayers: 680,
    plays: 7240,
    artTone: 'frost',
  }),
  catalogGame({
    name: 'Kingdom Clash',
    genres: ['Strategy'],
    category: 'strategy',
    description: 'Build, siege, and negotiate in a contest of rival crowns.',
    rating: 4.6,
    onlinePlayers: 810,
    plays: 8460,
    artTone: 'arena',
  }),
  catalogGame({
    name: 'War Command',
    genres: ['Strategy'],
    category: 'strategy',
    description: 'Issue real-time orders across a theater of modern conflict.',
    rating: 4.4,
    onlinePlayers: 520,
    plays: 5820,
    artTone: 'shadow',
  }),
  catalogGame({
    name: 'Football Legends',
    genres: ['Sports'],
    category: 'sports',
    description: 'Club rivalries, last-minute goals, and a season built for glory.',
    rating: 4.8,
    onlinePlayers: 2620,
    plays: 19840,
    artTone: 'forest',
    isTrending: true,
  }),
  catalogGame({
    name: 'Basketball Pro',
    genres: ['Sports'],
    category: 'sports',
    description: 'Pick-and-roll mastery and highlight dunks in a pro league sim.',
    rating: 4.6,
    onlinePlayers: 1400,
    plays: 11260,
    artTone: 'racing',
  }),
  catalogGame({
    name: 'Tennis Champions',
    genres: ['Sports'],
    category: 'sports',
    description: 'Serve, volley, and grind out five-set classics on tour.',
    rating: 4.4,
    onlinePlayers: 480,
    plays: 4920,
    artTone: 'frost',
  }),
  catalogGame({
    name: 'Street Cricket',
    genres: ['Sports'],
    category: 'sports',
    description: 'Tape-ball energy, rooftop catches, and neighborhood bragging rights.',
    rating: 4.7,
    onlinePlayers: 1700,
    plays: 13520,
    artTone: 'ember',
    isNew: true,
  }),
  catalogGame({
    name: 'Puzzle World',
    genres: ['Puzzle'],
    category: 'puzzle',
    description: 'A growing atlas of clever rooms, riddles, and satisfying snaps.',
    rating: 4.5,
    onlinePlayers: 620,
    plays: 8640,
    artTone: 'violet',
  }),
  catalogGame({
    name: 'Brain Challenge',
    genres: ['Puzzle'],
    category: 'puzzle',
    description: 'Daily logic gauntlets that get sharper the longer you last.',
    rating: 4.6,
    onlinePlayers: 710,
    plays: 9280,
    artTone: 'frost',
  }),
  catalogGame({
    name: 'Color Quest',
    genres: ['Casual', 'Puzzle'],
    category: 'puzzle',
    description: 'Match hues, chase combos, and unwind through vibrant boards.',
    rating: 4.3,
    onlinePlayers: 390,
    plays: 4120,
    artTone: 'violet',
    isNew: true,
  }),
  catalogGame({
    name: 'Pixel Builder',
    genres: ['Simulation'],
    category: 'simulation',
    description: 'Place every block with intent and watch a tiny world come alive.',
    rating: 4.5,
    onlinePlayers: 580,
    plays: 6740,
    artTone: 'forest',
  }),
  catalogGame({
    name: 'City Builder',
    genres: ['Simulation'],
    category: 'simulation',
    description: 'Zone, budget, and grow a skyline that actually works.',
    rating: 4.7,
    onlinePlayers: 1240,
    plays: 10820,
    artTone: 'galaxy',
    isTrending: true,
  }),
  catalogGame({
    name: 'Farm Life',
    genres: ['Simulation'],
    category: 'simulation',
    description: 'Plant, harvest, and turn a quiet plot into a thriving homestead.',
    rating: 4.4,
    onlinePlayers: 460,
    plays: 5380,
    artTone: 'forest',
  }),
  catalogGame({
    name: 'Airport Manager',
    genres: ['Simulation'],
    category: 'simulation',
    description: 'Keep gates moving, runways clear, and passengers on time.',
    rating: 4.3,
    onlinePlayers: 310,
    plays: 2840,
    artTone: 'frost',
    isNew: true,
  }),
];

const featuredBase = HOME_GAMES.find((game) => game.isFeatured) || HOME_GAMES[0];

export const FEATURED_GAME: FeaturedGame = {
  ...featuredBase,
  badge: 'FEATURED GAME',
  image: featuredBase.image,
};

export const FEATURED_BACKDROP = HERO_ARTWORK;

export const RECENT_GAMES: RecentGame[] = [
  {
    id: 'recent-chess',
    slug: 'chess',
    name: 'Chess',
    lastPlayed: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    progress: 68,
    artTone: 'ember',
    image: GAME_ARTWORK.chess,
    playable: true,
  },
  {
    id: 'recent-snake',
    slug: 'snake-multiplayer',
    name: 'Coil Rush',
    lastPlayed: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    progress: 41,
    artTone: 'cyber',
    image: GAME_ARTWORK['snake-multiplayer'],
    playable: true,
  },
  {
    id: 'recent-ludo',
    slug: 'ludo',
    name: 'Ludo',
    lastPlayed: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    progress: 22,
    artTone: 'forest',
    image: GAME_ARTWORK.ludo,
    playable: true,
  },
];

export const HOME_LEADERBOARD: HomeLeaderboardEntry[] = [
  { rank: 1, userId: 'p1', username: 'NovaKnight', level: 48, xp: 128400, wins: 412 },
  { rank: 2, userId: 'p2', username: 'AetherFox', level: 44, xp: 109220, wins: 367 },
  { rank: 3, userId: 'p3', username: 'VantaPrime', level: 41, xp: 96410, wins: 339 },
];

export const HOME_TOURNAMENTS: HomeTournament[] = [
  {
    id: 'weekly-arena',
    title: 'READY TO COMPETE?',
    description: 'Join the weekly tournament and compete for exclusive rewards.',
    prizePool: '$10,000',
    players: 1842,
    maxPlayers: 2048,
    countdown: '2d 14h 32m',
  },
];

export const MOCK_HOME_DATA: HomeData = {
  featuredGame: FEATURED_GAME,
  games: HOME_GAMES,
  categories: HOME_CATEGORIES,
  recentGames: RECENT_GAMES,
  leaderboard: HOME_LEADERBOARD,
  tournaments: HOME_TOURNAMENTS,
  multiplayer: {
    onlinePlayers: 12400,
    activeRooms: 248,
  },
};

export const SEARCH_FILTERS: { id: HomeSearchFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'top-rated', label: 'Top Rated' },
  { id: 'multiplayer', label: 'Multiplayer' },
];

export type LibrarySort = 'popular' | 'name' | 'rating' | 'new';

export const LIBRARY_SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'rating', label: 'Top rated' },
  { value: 'new', label: 'Newest' },
];

const LIBRARY_FOCUS_IDS: LibraryCategoryId[] = [
  'all',
  'chess',
  'strategy',
  'puzzle',
  'arcade',
  'multiplayer',
  'casual',
];

const LIBRARY_EXTRA_CATEGORIES: LibraryCategory[] = [
  { id: 'chess', label: 'Chess', icon: '♟️', tone: 'frost' },
  { id: 'casual', label: 'Casual', icon: '🎲', tone: 'violet' },
];

const LIBRARY_CATEGORY_MAP = new Map<LibraryCategoryId, LibraryCategory>([
  ...HOME_CATEGORIES.map((category) => [category.id, category] as const),
  ...LIBRARY_EXTRA_CATEGORIES.map((category) => [category.id, category] as const),
]);

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  ...LIBRARY_FOCUS_IDS.map((id) => LIBRARY_CATEGORY_MAP.get(id)).filter(
    (category): category is LibraryCategory => Boolean(category)
  ),
  ...HOME_CATEGORIES.filter((category) => !LIBRARY_FOCUS_IDS.includes(category.id)),
];

export function getHomeCategory(id: string): HomeCategory | LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((category) => category.id === id) || HOME_CATEGORIES.find((category) => category.id === id);
}

export function categoryHref(id: string): string {
  if (!id || id === 'all') return '/games';
  return `/games?category=${id}`;
}

export function formatPlayerCount(count: number): string {
  if (count >= 1000) {
    const value = count / 1000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

export function gameMatchesCategory(game: HomeGame, category: string): boolean {
  if (!category || category === 'all') return true;
  if (category === 'multiplayer') return Boolean(game.isMultiplayer);
  if (category === 'casual') return !game.isMultiplayer;
  if (category === 'chess') {
    const haystack = [game.slug, game.name, ...game.tags, ...game.genres].join(' ').toLowerCase();
    return haystack.includes('chess');
  }
  return (
    game.category === category ||
    game.tags.some((tag) => tag.toLowerCase() === category) ||
    game.genres.some((genre) => genre.toLowerCase() === category)
  );
}

export function filterGamesByCategory(games: HomeGame[], category: string): HomeGame[] {
  return games.filter((game) => gameMatchesCategory(game, category));
}

export function filterHomeGames(games: HomeGame[], filter: HomeSearchFilter): HomeGame[] {
  switch (filter) {
    case 'popular':
      return [...games].sort((a, b) => b.plays + b.onlinePlayers - (a.plays + a.onlinePlayers));
    case 'new':
      return games.filter((game) => game.isNew);
    case 'top-rated':
      return [...games].sort((a, b) => b.rating - a.rating);
    case 'multiplayer':
      return games.filter((game) => game.isMultiplayer);
    default:
      return games;
  }
}

export function searchGames(games: HomeGame[], query: string): HomeGame[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return games;
  return games.filter((game) => {
    const haystack = [
      game.name,
      game.genre,
      game.description,
      game.category,
      ...game.tags,
      ...game.genres,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function sortLibraryGames(games: HomeGame[], sort: LibrarySort): HomeGame[] {
  const next = [...games];
  switch (sort) {
    case 'name':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'rating':
      return next.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    case 'new':
      return next.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || b.plays - a.plays);
    case 'popular':
    default:
      return next.sort((a, b) => b.plays + b.onlinePlayers - (a.plays + a.onlinePlayers));
  }
}

export function getLibraryFeaturedGames(games: HomeGame[], limit = 3): HomeGame[] {
  const featured = games.filter((game) => game.isFeatured);
  if (featured.length > 0) return featured.slice(0, limit);
  const playable = games.filter((game) => game.playable);
  if (playable.length > 0) return playable.slice(0, limit);
  return games.slice(0, limit);
}

export function categoryGameCounts(games: HomeGame[]): Record<string, number> {
  return HOME_CATEGORIES.reduce<Record<string, number>>((counts, category) => {
    counts[category.id] =
      category.id === 'all' ? games.length : filterGamesByCategory(games, category.id).length;
    return counts;
  }, {});
}

export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export function playerCountLabel(game: HomeGame): string | undefined {
  if (!game.minPlayers && !game.maxPlayers) return undefined;
  const min = game.minPlayers || 2;
  const max = game.maxPlayers || min;
  if (min === max) return `${max} PLAYERS`;
  return `${min}-${max} PLAYERS`;
}

export function isHomeCategoryId(value: string): value is HomeCategoryId {
  return HOME_CATEGORIES.some((category) => category.id === value);
}
