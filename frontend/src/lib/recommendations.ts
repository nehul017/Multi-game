import type { HomeGame, RecentGame } from '@/types/home';

function tagOverlap(game: HomeGame, recent: HomeGame[]): number {
  const recentTags = new Set(recent.flatMap((item) => item.tags.map((tag) => tag.toLowerCase())));
  return game.tags.reduce((score, tag) => score + (recentTags.has(tag.toLowerCase()) ? 1 : 0), 0);
}

export function recommendGames(
  games: HomeGame[],
  recentGames: RecentGame[] = [],
  limit = 5
): HomeGame[] {
  const recentSlugs = new Set(recentGames.map((game) => game.slug));
  const recentCatalog = games.filter((game) => recentSlugs.has(game.slug));
  const recentCategories = new Set(recentCatalog.map((game) => game.category));

  return [...games]
    .map((game) => {
      let score = game.rating * 12;
      score += Math.min(game.onlinePlayers, 5000) / 70;
      score += Math.min(game.plays, 20000) / 250;
      if (recentCategories.has(game.category)) score += 16;
      score += tagOverlap(game, recentCatalog) * 5;
      if (game.isTrending) score += 6;
      if (recentSlugs.has(game.slug)) score -= 14;
      return { game, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ game }) => game)
    .slice(0, limit);
}
