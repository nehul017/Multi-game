'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FALLBACK_ARTWORK } from '@/data/artwork';
import { cn } from '@/lib/utils';
import type { GameArtTone } from '@/types/home';

const TONES: Record<GameArtTone, string> = {
  crimson: 'home-art-crimson',
  cyber: 'home-art-cyber',
  racing: 'home-art-racing',
  arena: 'home-art-arena',
  shadow: 'home-art-shadow',
  galaxy: 'home-art-galaxy',
  frost: 'home-art-frost',
  ember: 'home-art-ember',
  violet: 'home-art-violet',
  forest: 'home-art-forest',
};

interface GameArtworkProps {
  alt: string;
  tone: GameArtTone;
  src?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  zoomOnHover?: boolean;
}

export function GameArtwork({
  alt,
  tone,
  src,
  priority = false,
  className,
  sizes = '(max-width: 768px) 50vw, 20vw',
  zoomOnHover = true,
}: GameArtworkProps) {
  const [failed, setFailed] = useState(false);
  const resolved = !failed && src && src !== FALLBACK_ARTWORK ? src : undefined;

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-theme-secondary', className)}>
      {!resolved && (
        <div
          className={cn(
            'absolute inset-0 home-art',
            TONES[tone],
            zoomOnHover && 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]'
          )}
          aria-hidden="true"
        />
      )}
      {resolved && (
        <Image
          src={resolved}
          alt={alt}
          fill
          quality={92}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          sizes={sizes}
          className={cn(
            'object-cover object-center',
            zoomOnHover && 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]'
          )}
          onError={() => setFailed(true)}
        />
      )}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          resolved ? 'home-art-sheen-photo' : 'home-art-sheen'
        )}
        aria-hidden="true"
      />
    </div>
  );
}
