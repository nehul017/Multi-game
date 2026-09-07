'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface GamesBreadcrumbProps {
  current: string;
}

export function GamesBreadcrumb({ current }: GamesBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      <Link
        href="/games"
        className="text-theme-muted hover:text-theme-primary transition-colors shrink-0"
      >
        Games
      </Link>
      <ChevronRight className="w-3.5 h-3.5 text-theme-muted shrink-0" aria-hidden="true" />
      <span className="text-theme-primary font-medium truncate">{current}</span>
    </nav>
  );
}
