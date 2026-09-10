'use client';

import { useEffect, useMemo } from 'react';
import { getHomeHash, scrollToHomeSection } from '@/lib/homeNav';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { TrendingGames } from '@/components/home/TrendingGames';
import { PopularGames } from '@/components/home/PopularGames';
import { NewReleases } from '@/components/home/NewReleases';
import { MultiplayerSection } from '@/components/home/MultiplayerSection';
import { RecommendedGames } from '@/components/home/RecommendedGames';
import { CommunityCTA } from '@/components/home/CommunityCTA';
import { LeaderboardPreview } from '@/components/home/LeaderboardPreview';
import { TournamentBanner } from '@/components/home/TournamentBanner';
import { RecentlyPlayed } from '@/components/home/RecentlyPlayed';
import { HomeHeroSkeleton } from '@/components/home/HomeSkeletons';
import { HomeAtmosphere } from '@/components/home/atmosphere/HomeAtmosphere';
import { PageTransition } from '@/components/motion/PageTransition';
import { useHomeData } from '@/hooks/useHomeData';
import { categoryGameCounts, filterHomeGames } from '@/data/home';
import { recommendGames } from '@/lib/recommendations';

export function HomePage() {
  const { data, isLoading } = useHomeData();
  const showHeroSkeleton = isLoading && data.games.length === 0;

  const trending = useMemo(
    () => data.games.filter((game) => game.isTrending).slice(0, 5),
    [data.games]
  );

  const popular = useMemo(
    () => filterHomeGames(data.games, 'popular').slice(0, 5),
    [data.games]
  );

  const releases = useMemo(
    () => data.games.filter((game) => game.isNew).slice(0, 4),
    [data.games]
  );

  const multiplayerGames = useMemo(
    () => data.games.filter((game) => game.isMultiplayer).slice(0, 5),
    [data.games]
  );

  const recommended = useMemo(
    () => recommendGames(data.games, data.recentGames, 5),
    [data.games, data.recentGames]
  );

  const counts = useMemo(() => categoryGameCounts(data.games), [data.games]);
  const tournament = data.tournaments[0];

  useEffect(() => {
    const hash = getHomeHash();
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToHomeSection(hash), 160);
    return () => window.clearTimeout(timer);
  }, [data.games.length]);

  return (
    <AppShell>
      <div className="min-h-screen flex flex-col overflow-x-clip relative">
        <HomeAtmosphere />
        <a
          href="#trending"
          className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-theme-card focus:text-theme-primary"
        >
          Skip to games
        </a>
        <HomeHeader />
        <PageTransition>
          <main id="main" className="relative z-[1]">
            {showHeroSkeleton ? <HomeHeroSkeleton /> : <HeroSection game={data.featuredGame} />}
            <TrendingGames games={trending} isLoading={showHeroSkeleton} />
            <CategorySection categories={data.categories} counts={counts} />
            <PopularGames games={popular} isLoading={showHeroSkeleton} />
            <NewReleases games={releases} isLoading={showHeroSkeleton} />
            <MultiplayerSection
              games={multiplayerGames}
              stats={data.multiplayer}
              isLoading={showHeroSkeleton}
            />
            <RecommendedGames games={recommended} isLoading={showHeroSkeleton} />
            <LeaderboardPreview players={data.leaderboard} />
            {tournament && <TournamentBanner tournament={tournament} />}
            <RecentlyPlayed games={data.recentGames} />
            <CommunityCTA />
          </main>
        </PageTransition>
        <div className="relative z-[1]">
          <Footer />
        </div>
      </div>
    </AppShell>
  );
}
