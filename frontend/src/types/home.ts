export type HomeCategoryId =
  | 'all'
  | 'action'
  | 'adventure'
  | 'racing'
  | 'rpg'
  | 'strategy'
  | 'shooter'
  | 'sports'
  | 'puzzle'
  | 'simulation'
  | 'arcade'
  | 'multiplayer';

export type HomeGameCategoryId = Exclude<HomeCategoryId, 'all'>;

export type HomeSearchFilter = 'all' | 'popular' | 'new' | 'top-rated' | 'multiplayer';

export type GameArtTone =
  | 'crimson'
  | 'cyber'
  | 'racing'
  | 'arena'
  | 'shadow'
  | 'galaxy'
  | 'frost'
  | 'ember'
  | 'violet'
  | 'forest';

export interface HomeGame {
  id: string;
  slug: string;
  name: string;
  description: string;
  genre: string;
  genres: string[];
  category: HomeGameCategoryId;
  rating: number;
  onlinePlayers: number;
  plays: number;
  image?: string;
  artTone: GameArtTone;
  isNew?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  isMultiplayer?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
  tags: string[];
  playable: boolean;
}

export interface FeaturedGame extends HomeGame {
  badge: string;
}

export interface HomeCategory {
  id: HomeCategoryId;
  label: string;
  icon: string;
  tone: GameArtTone;
}

export type LibraryCategoryId = HomeCategoryId | 'chess' | 'casual';

export interface LibraryCategory {
  id: LibraryCategoryId;
  label: string;
  icon: string;
  tone: GameArtTone;
}

export interface RecentGame {
  id: string;
  slug: string;
  name: string;
  lastPlayed: string;
  progress: number;
  artTone: GameArtTone;
  image?: string;
  playable: boolean;
}

export interface HomeLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  wins: number;
}

export interface HomeTournament {
  id: string;
  title: string;
  description: string;
  prizePool: string;
  players: number;
  maxPlayers: number;
  countdown: string;
}

export interface HomeMultiplayerStats {
  onlinePlayers: number;
  activeRooms: number;
}

export interface HomeData {
  featuredGame: FeaturedGame;
  games: HomeGame[];
  categories: HomeCategory[];
  recentGames: RecentGame[];
  leaderboard: HomeLeaderboardEntry[];
  tournaments: HomeTournament[];
  multiplayer: HomeMultiplayerStats;
}

export const PLATFORM_GAME_SLUGS = [
  'tic-tac-toe',
  'connect-four',
  'chess',
  'snake-multiplayer',
  'ludo',
  'quiz-battle',
] as const;

export function isPlatformGame(slug: string): boolean {
  return (PLATFORM_GAME_SLUGS as readonly string[]).includes(slug);
}

export function gamePlayHref(slug: string): string {
  return isPlatformGame(slug) ? `/games/${slug}/play` : '/games';
}

export function gameDetailsHref(slug: string): string {
  return isPlatformGame(slug) ? `/games/${slug}` : '/games';
}

export function quickPlayHref(): string {
  return gamePlayHref('chess');
}

export function formatGameTitle(slug: string): string {
  if (slug === 'snake-multiplayer') return 'Coil Rush';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
