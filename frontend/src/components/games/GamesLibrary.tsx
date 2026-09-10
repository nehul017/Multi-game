'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { GameCategories } from './GameCategories';
import { GamesHeader } from './GamesHeader';
import { FeaturedGames } from './FeaturedGames';
import { AllGames } from './AllGames';
import { PageTransition } from '@/components/motion/PageTransition';
import { EASE_OUT } from '@/lib/motion';
import {
  getLibraryFeaturedGames,
  gameMatchesCategory,
  searchGames,
  sortLibraryGames,
  type LibrarySort,
} from '@/data/home';
import { useHomeData } from '@/hooks';
import type { LibraryCategoryId } from '@/types/home';

export function GamesLibrary() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState<LibrarySort>('popular');
  const category = searchParams.get('category') || 'all';
  const { data, isLoading, isError } = useHomeData();
  const reduceMotion = useReducedMotion();
  const hasActiveFilters = Boolean(search.trim() || (category && category !== 'all'));
  const catalogKey = `${category}:${search.trim()}:${sort}`;

  const filteredGames = useMemo(() => {
    const bySearch = searchGames(data.games, search);
    const byCategory = bySearch.filter((game) => gameMatchesCategory(game, category));
    return sortLibraryGames(byCategory, sort);
  }, [data.games, search, category, sort]);

  const featuredGames = useMemo(() => {
    if (search.trim() || (category && category !== 'all')) return [];
    return getLibraryFeaturedGames(data.games);
  }, [data.games, search, category]);

  const updateCategory = (next: LibraryCategoryId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'all') params.delete('category');
    else params.set('category', next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set('q', value.trim());
    else params.delete('q');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const resetFilters = () => {
    setSearch('');
    setSort('popular');
    router.replace(pathname, { scroll: false });
  };

  return (
    <PageTransition className="space-y-8 min-w-0 overflow-x-clip">
      <GamesHeader
        search={search}
        sort={sort}
        onSearchChange={handleSearchChange}
        onSortChange={setSort}
      />
      <GameCategories selected={category} onSelect={updateCategory} games={data.games} />
      <motion.div
        key={catalogKey}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        className="space-y-8"
      >
        <FeaturedGames games={featuredGames} />
        <AllGames
          games={filteredGames}
          isLoading={isLoading}
          isError={isError}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        />
      </motion.div>
    </PageTransition>
  );
}
