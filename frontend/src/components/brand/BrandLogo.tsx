import { useId } from 'react';
import { cn } from '@/lib/utils';

type BrandLogoSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<BrandLogoSize, string> = {
  sm: 'brand-logo-sm',
  md: 'brand-logo-md',
  lg: 'brand-logo-lg',
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  glow?: boolean;
  className?: string;
}

export function BrandLogo({ size = 'sm', glow = true, className }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <span
      className={cn('brand-logo', SIZE_CLASS[size], glow && 'brand-logo-glow', className)}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="brand-logo-svg" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D8B4FE" />
            <stop offset="28%" stopColor="#C084FC" />
            <stop offset="62%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="17.5" fill={`url(#${uid}-bg)`} />
        <rect x="2" y="2" width="60" height="60" rx="17.5" fill={`url(#${uid}-shine)`} />
        <path
          d="M18.2 21.4h27.6c3.55 0 6.15 3.15 5.55 6.62l-1.28 7.42c-.48 2.78-2.9 4.76-5.72 4.76h-1.08c-1.05 0-2.02-.56-2.52-1.48L38.2 34.4H25.8l-2.55 4.32c-.5.92-1.47 1.48-2.52 1.48h-1.08c-2.82 0-5.24-1.98-5.72-4.76l-1.28-7.42c-.6-3.47 2-6.62 5.55-6.62Z"
          stroke="#FFFFFF"
          strokeWidth="2.35"
          strokeLinejoin="round"
        />
        <path
          d="M21.15 26.15v7.1M17.6 29.7h7.1"
          stroke="#FFFFFF"
          strokeWidth="2.35"
          strokeLinecap="round"
        />
        <circle cx="41.15" cy="26.55" r="1.28" fill="#FFFFFF" />
        <circle cx="44.55" cy="29.7" r="1.28" fill="#FFFFFF" />
        <circle cx="41.15" cy="32.85" r="1.28" fill="#FFFFFF" />
        <circle cx="37.75" cy="29.7" r="1.28" fill="#FFFFFF" />
      </svg>
    </span>
  );
}
