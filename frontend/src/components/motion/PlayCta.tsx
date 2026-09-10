'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayCtaProps {
  href: string;
  label?: string;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function PlayCta({
  href,
  label = 'PLAY',
  ariaLabel,
  size = 'sm',
  className,
}: PlayCtaProps) {
  return (
    <Link href={href} aria-label={ariaLabel} className={cn('home-play-cta', size === 'md' && 'home-play-cta-md', className)}>
      <span className="home-play-cta-glow" aria-hidden="true" />
      <Play className="home-play-cta-icon" />
      <span>{label}</span>
    </Link>
  );
}
