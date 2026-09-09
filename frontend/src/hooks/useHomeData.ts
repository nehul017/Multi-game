'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MOCK_HOME_DATA, unwrapList } from '@/data/home';
import { resolveGameImage } from '@/data/artwork';
import { useAuthStore } from '@/store/auth.store';
import { gameService } from '@/services/game.service';
import { leaderboardService } from '@/services/leaderboard.service';
import { tournamentService } from '@/services/tournament.service';
import { userService } from '@/services/user.service';
import type { Game, LeaderboardEntry, Match, Tournament } from '@/types';
import type {
  GameArtTone,
  HomeData,
  HomeGame,
  HomeGameCategoryId,
  HomeLeaderboardEntry,
  RecentGame,
} from '@/types/home';
import { isPlatformGame } from '@/types/home';

const ART_TONES: GameArtTone[] = [
  'crimson',
  'cyber',
  'racing',
  'arena',
  'shadow',
  'galaxy',
  'frost',
  'ember',
  'violet',
  'forest',
];

function toneFromSlug(slug: string, index: number): GameArtTone {
  const mapped: Record<string, GameArtTone> = {
    chess: 'ember',
    'tic-tac-toe': 'frost',
    'connect-four': 'racing',
    'snake-multiplayer': 'cyber',
    ludo: 'forest',
    'quiz-battle': 'violet',
    'block-master': 'cyber',
    'classic-fruit-slots': 'ember',
    poker: 'forest',
    mindi: 'violet',
    'puzzle-world': 'violet',
    'jigsaw-world': 'frost',
  };
  return mapped[slug] ?? ART_TONES[index % ART_TONES.length];
}

const HOME_GAME_CATEGORIES: HomeGameCategoryId[] = [
  'action',
  'adventure',
  'racing',
  'rpg',
  'strategy',
  'shooter',
  'sports',
  'puzzle',
  'simulation',
  'arcade',
  'multiplayer',
];

function mapApiCategory(category: string, fallback: HomeGame['category']): HomeGame['category'] {
  const value = (category || '').toLowerCase();
  if (HOME_GAME_CATEGORIES.includes(value as HomeGameCategoryId)) {
    return value as HomeGameCategoryId;
  }
  if (value === 'trivia' || value === 'casual') return 'puzzle';
  if (value === 'board') return fallback || 'strategy';
  return fallback || 'arcade';
}

const FEATURED_SLUGS = new Set(['chess', 'snake-multiplayer', 'ludo']);

function apiGameId(game: Game): string {
  return game.id || game._id || game.slug;
}

function mapApiGame(game: Game, index: number, base?: HomeGame): HomeGame {
  const slug = game.slug;
  const minPlayers = game.minPlayers || base?.minPlayers || 2;
  const maxPlayers = game.maxPlayers || base?.maxPlayers || minPlayers;
  const tags = base?.tags || [game.category || 'Multiplayer'];
  return {
    id: apiGameId(game),
    slug,
    name: slug === 'snake-multiplayer' ? 'Coil Rush' : game.name || base?.name || slug,
    description:
      slug === 'snake-multiplayer'
        ? 'Original slither battle. Steer, boost, eat pellets, and cut rival coils in a live arena.'
        : game.description || base?.description || '',
    genre: base?.genre || game.category || 'Multiplayer',
    genres: base?.genres || [game.category || 'Multiplayer'],
    category: mapApiCategory(game.category, base?.category || 'arcade'),
    rating: base?.rating ?? 4.5,
    onlinePlayers: game.onlinePlayers || base?.onlinePlayers || 0,
    plays: game.totalMatches || base?.plays || 0,
    image: resolveGameImage(slug, game.thumbnail),
    artTone: base?.artTone || toneFromSlug(slug, index),
    isNew: base?.isNew,
    isTrending: base?.isTrending,
    isFeatured: FEATURED_SLUGS.has(slug) || Boolean(base?.isFeatured),
    isMultiplayer: base?.isMultiplayer ?? maxPlayers > 1,
    minPlayers,
    maxPlayers,
    tags,
    playable: isPlatformGame(slug),
  };
}

function mapLeaderboard(entry: LeaderboardEntry, index: number): HomeLeaderboardEntry {
  return {
    rank: entry.rank || index + 1,
    userId: entry.userId,
    username: entry.username,
    avatar: entry.avatar,
    level: entry.level || 1,
    xp: entry.elo ? entry.elo * 24 : (entry.level || 1) * 2200,
    wins: entry.wins || 0,
  };
}

function mapRecentMatch(match: Match, index: number): RecentGame | null {
  const slug = match.gameSlug;
  if (!slug) return null;
  return {
    id: match.id || `recent-${index}`,
    slug,
    name: match.gameName || slug,
    lastPlayed: match.finishedAt || match.startedAt || new Date().toISOString(),
    progress: Math.min(95, 28 + index * 18),
    artTone: toneFromSlug(slug, index),
    image: resolveGameImage(slug),
    playable: isPlatformGame(slug),
  };
}

export function useHomeData() {
  const { user, isAuthenticated } = useAuthStore();

  const gamesQuery = useQuery({
    queryKey: ['home', 'games'],
    queryFn: () => gameService.getGames(),
    staleTime: 60_000,
    retry: 0,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['home', 'leaderboard'],
    queryFn: () => leaderboardService.getTopPlayers(3),
    staleTime: 60_000,
    retry: 0,
  });

  const tournamentsQuery = useQuery({
    queryKey: ['home', 'tournaments'],
    queryFn: () => tournamentService.getTournaments(1, 3),
    staleTime: 60_000,
    retry: 0,
  });

  const matchesQuery = useQuery({
    queryKey: ['home', 'recentMatches', user?.id],
    queryFn: () => userService.getMatchHistory(user?.id, 1, 6),
    enabled: Boolean(user?.id && isAuthenticated),
    staleTime: 30_000,
    retry: 0,
  });

  const data = useMemo<HomeData>(() => {
    const apiGames = unwrapList<Game>(gamesQuery.data?.data);
    const catalogBySlug = new Map(MOCK_HOME_DATA.games.map((game) => [game.slug, game]));
    const games = apiGames.map((game, index) =>
      mapApiGame(game, index, catalogBySlug.get(game.slug))
    );

    const apiLeaderboard = unwrapList<LeaderboardEntry>(leaderboardQuery.data?.data)
      .slice(0, 3)
      .map(mapLeaderboard);

    const apiTournaments = unwrapList<Tournament>(tournamentsQuery.data?.data).map((tournament) => ({
      id: tournament.id,
      title: 'READY TO COMPETE?',
      description: tournament.description || MOCK_HOME_DATA.tournaments[0].description,
      prizePool: tournament.prize || MOCK_HOME_DATA.tournaments[0].prizePool,
      players: tournament.currentParticipants || 0,
      maxPlayers: tournament.maxParticipants || 0,
      countdown: MOCK_HOME_DATA.tournaments[0].countdown,
    }));

    const apiRecent = unwrapList<Match>(matchesQuery.data?.data)
      .map(mapRecentMatch)
      .filter((item): item is RecentGame => Boolean(item));

    const featuredBase =
      games.find((game) => game.isFeatured) ||
      games.find((game) => game.playable) ||
      games[0] ||
      MOCK_HOME_DATA.featuredGame;

    const onlinePlayers = games.reduce((sum, game) => sum + game.onlinePlayers, 0);

    return {
      featuredGame: {
        ...featuredBase,
        badge: 'FEATURED GAME',
        tags: featuredBase.tags,
      },
      games,
      categories: MOCK_HOME_DATA.categories,
      recentGames: apiRecent.length
        ? apiRecent
        : isAuthenticated
          ? MOCK_HOME_DATA.recentGames
          : [],
      leaderboard: apiLeaderboard.length >= 3 ? apiLeaderboard : MOCK_HOME_DATA.leaderboard,
      tournaments: apiTournaments.length ? apiTournaments : MOCK_HOME_DATA.tournaments,
      multiplayer: {
        onlinePlayers,
        activeRooms: MOCK_HOME_DATA.multiplayer.activeRooms,
      },
    };
  }, [gamesQuery.data, leaderboardQuery.data, tournamentsQuery.data, matchesQuery.data, isAuthenticated]);

  return {
    data,
    isAuthenticated,
    user,
    isLoading: gamesQuery.isLoading,
    isError: gamesQuery.isError,
    isLeaderboardLoading: leaderboardQuery.isLoading,
  };
}
