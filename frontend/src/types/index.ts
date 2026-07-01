export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'online' | 'offline' | 'in-game' | 'away';
  elo: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  rank: RankTier;
  achievements: Achievement[];
  createdAt: string;
  lastSeen: string;
  isBanned: boolean;
}

export interface UserProfile extends User {
  friends: Friend[];
  matchHistory: Match[];
  stats: UserStats;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  favoriteGame: string;
  totalPlayTime: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  onlinePlayers: number;
  totalMatches: number;
  isActive: boolean;
  rules: string;
  createdAt: string;
}

export interface Match {
  id: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  players: MatchPlayer[];
  winner?: string;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  moves: Move[];
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  eloChanges: Record<string, number>;
}

export interface MatchPlayer {
  userId: string;
  username: string;
  avatar?: string;
  elo: number;
  side: string;
  isReady: boolean;
}

export interface Move {
  id: string;
  playerId: string;
  position: string | number | number[];
  timestamp: string;
  notation?: string;
}

export type GameState = {
  board: unknown;
  currentTurn: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  winner?: string;
  winningLine?: number[];
  lastMove?: Move;
  moveCount: number;
  timeLeft: Record<string, number>;
};

export interface Room {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  host: string;
  hostUsername: string;
  players: RoomPlayer[];
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  status: 'waiting' | 'playing' | 'finished';
  spectators: string[];
  createdAt: string;
}

export interface RoomPlayer {
  userId: string;
  username: string;
  avatar?: string;
  elo: number;
  isReady: boolean;
  side?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  status: 'upcoming' | 'registration' | 'in-progress' | 'finished';
  maxParticipants: number;
  currentParticipants: number;
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  startDate: string;
  endDate?: string;
  prize?: string;
  rules: string;
  createdAt: string;
}

export interface TournamentParticipant {
  userId: string;
  username: string;
  avatar?: string;
  elo: number;
  seed: number;
  eliminated: boolean;
}

export interface TournamentBracket {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  player1?: TournamentParticipant;
  player2?: TournamentParticipant;
  winner?: string;
  score?: string;
  status: 'pending' | 'playing' | 'finished';
  scheduledAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'system' | 'emoji' | 'game-invite';
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'private' | 'group' | 'game';
  name?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'in-game';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'game' | 'lobby' | 'tournament';
  participants: string[];
  messages: Message[];
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'game_start'
  | 'tournament_start'
  | 'tournament_result'
  | 'achievement'
  | 'level_up'
  | 'system'
  | 'message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  elo: number;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
  gamesPlayed: number;
}

export type RankTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface Friend {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'in-game';
  elo: number;
  lastSeen: string;
}

export interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    username: string;
    avatar?: string;
    elo: number;
  };
  toUser: {
    id: string;
    username: string;
    avatar?: string;
  };
  status: FriendStatus;
  createdAt: string;
}

export type FriendStatus = 'pending' | 'accepted' | 'rejected';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  onlineNow: number;
  totalGames: number;
  totalMatches: number;
  runningMatches: number;
  totalTournaments: number;
  newUsersToday: number;
  matchesToday: number;
  dailyActiveUsers: { date: string; count: number }[];
  gamesDistribution: { name: string; value: number }[];
  newUsersChart: { date: string; count: number }[];
  matchesChart: { date: string; count: number }[];
}

export interface ServerHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  memory: { used: number; total: number };
  cpu: number;
  connections: number;
  lastCheck: string;
}
