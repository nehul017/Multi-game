import type { ReactElement } from 'react';
import type { SymbolId } from '../types';

interface SymbolArtProps {
  className?: string;
  uid?: string;
}

function Cherry({ className, uid = 'c' }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-cherry`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ff8b8b" />
          <stop offset="55%" stopColor="#e11d2e" />
          <stop offset="100%" stopColor="#7a0d16" />
        </radialGradient>
      </defs>
      <path d="M32 8c1.5 11 8 17 17 20" fill="none" stroke="#2f6b24" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M32 8c-1.4 10-7 15-14 18" fill="none" stroke="#2f6b24" strokeWidth="3.2" strokeLinecap="round" />
      <ellipse cx="40" cy="20" rx="8" ry="4" fill="#4cae32" transform="rotate(-26 40 20)" />
      <circle cx="22" cy="43" r="13.5" fill={`url(#${uid}-cherry)`} />
      <circle cx="43" cy="40" r="13.5" fill={`url(#${uid}-cherry)`} />
      <ellipse cx="18" cy="38" rx="3.4" ry="2.2" fill="rgba(255,255,255,0.5)" />
      <ellipse cx="39" cy="35" rx="3.4" ry="2.2" fill="rgba(255,255,255,0.5)" />
      <ellipse cx="26" cy="50" rx="5" ry="2" fill="rgba(0,0,0,0.18)" />
    </svg>
  );
}

function Lemon({ className, uid = 'l' }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-lemon`} cx="34%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff6a8" />
          <stop offset="58%" stopColor="#f2cc22" />
          <stop offset="100%" stopColor="#b88608" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="35" rx="21" ry="16.5" fill={`url(#${uid}-lemon)`} transform="rotate(-16 32 35)" />
      <path d="M18 26c7-5 16-5 23 1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <circle cx="46" cy="24" r="3.2" fill="#f6e27a" />
      <ellipse cx="32" cy="50" rx="10" ry="2.4" fill="rgba(0,0,0,0.12)" />
    </svg>
  );
}

function Orange({ className, uid = 'o' }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-orange`} cx="33%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffd19a" />
          <stop offset="50%" stopColor="#ff8a1c" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="36" r="18.5" fill={`url(#${uid}-orange)`} />
      <path d="M32 17c4 3 6.5 6.5 6.5 11" fill="none" stroke="#2f7a28" strokeWidth="2.6" />
      <ellipse cx="39" cy="19" rx="7.5" ry="3.6" fill="#49a82d" transform="rotate(18 39 19)" />
      <circle cx="25" cy="30" r="2.6" fill="rgba(255,255,255,0.32)" />
    </svg>
  );
}

function Grapes({ className, uid = 'g' }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-grape`} cx="34%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>
      <path d="M33 9c1 9 6 13 12 15" fill="none" stroke="#2f6b24" strokeWidth="2.6" />
      <ellipse cx="41" cy="17" rx="6.5" ry="3.2" fill="#49a82d" />
      {[
        [26, 30],
        [38, 30],
        [32, 38],
        [22, 42],
        [42, 42],
        [32, 51],
      ].map(([cx, cy], index) => (
        <circle key={index} cx={cx} cy={cy} r={index > 2 ? 6.6 : 7.1} fill={`url(#${uid}-grape)`} />
      ))}
    </svg>
  );
}

function Watermelon({ className }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M8 42a24 24 0 0 1 48 0" fill="#166534" />
      <path d="M12 42a20 20 0 0 1 40 0" fill="#22c55e" />
      <path d="M16 42a16 16 0 0 1 32 0" fill="#fb7185" />
      <path d="M20 42a12 12 0 0 1 24 0" fill="#e11d48" />
      <circle cx="28" cy="37" r="1.5" fill="#111" />
      <circle cx="36" cy="35" r="1.5" fill="#111" />
      <circle cx="32" cy="41" r="1.5" fill="#111" />
    </svg>
  );
}

function Bell({ className, uid = 'b' }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-bell`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1a8" />
          <stop offset="48%" stopColor="#f5c518" />
          <stop offset="100%" stopColor="#8a6410" />
        </linearGradient>
      </defs>
      <path d="M32 8c11 0 17 11 17 24v8l6.5 8.5H10.5L17 40v-8C17 19 21 8 32 8z" fill={`url(#${uid}-bell)`} />
      <rect x="21" y="48" width="22" height="5.5" rx="2.6" fill="#f4d35e" />
      <circle cx="32" cy="55" r="3.8" fill="#d97706" />
      <circle cx="25" cy="23" r="3.2" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function Seven({ className, uid = 's' }: SymbolArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-seven`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="42%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      <text
        x="32"
        y="48"
        textAnchor="middle"
        fontSize="44"
        fontWeight="800"
        fontFamily="Georgia, serif"
        fill={`url(#${uid}-seven)`}
        stroke="#7f1d1d"
        strokeWidth="1.1"
      >
        7
      </text>
      <path d="M11 15l5 3.5-5 3.5 5-3.5z" fill="#fbbf24" />
      <path d="M50 19l4 2.5-4 2.5 4-2.5z" fill="#fbbf24" />
    </svg>
  );
}

const ART: Record<SymbolId, (props: SymbolArtProps) => ReactElement> = {
  cherry: Cherry,
  lemon: Lemon,
  orange: Orange,
  grapes: Grapes,
  watermelon: Watermelon,
  bell: Bell,
  seven: Seven,
};

export const SYMBOL_LABELS: Record<SymbolId, string> = {
  cherry: 'Cherry',
  lemon: 'Lemon',
  orange: 'Orange',
  grapes: 'Grapes',
  watermelon: 'Watermelon',
  bell: 'Bell',
  seven: 'Lucky 7',
};

export function SymbolArt({ id, className, uid }: { id: SymbolId; className?: string; uid?: string }) {
  const Cmp = ART[id];
  return <Cmp className={className} uid={uid} />;
}
