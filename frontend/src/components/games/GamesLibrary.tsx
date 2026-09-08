'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { GameCategories } from './GameCategories';
import { GamesHeader } from './GamesHeader';
import { FeaturedGames } from './FeaturedGames';
import { AllGames } from './AllGames';
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
  const hasActiveFilters = Boolean(search.trim() || (category && category !== 'all'));

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
    <div className="space-y-8 min-w-0 overflow-x-clip">
      <GamesHeader
        search={search}
        sort={sort}
        onSearchChange={handleSearchChange}
        onSortChange={setSort}
      />
      <GameCategories selected={category} onSelect={updateCategory} games={data.games} />
      <FeaturedGames games={featuredGames} />
      <AllGames
        games={filteredGames}
        isLoading={isLoading}
        isError={isError}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />
    </div>
  );
}
