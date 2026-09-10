'use client';

import { motion, type MotionValue, useTransform } from 'framer-motion';

type FloatKind =
  | 'ace-spade'
  | 'king-heart'
  | 'queen-diamond'
  | 'jack-club'
  | 'chip-gold'
  | 'chip-red'
  | 'dice'
  | 'seven'
  | 'cherry'
  | 'star'
  | 'diamond'
  | 'bell'
  | 'coin'
  | 'hex';

interface FloatItem {
  id: string;
  kind: FloatKind;
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
  rotate: number;
  desktopOnly?: boolean;
}

const FLOATS: FloatItem[] = [
  { id: 'ace', kind: 'ace-spade', top: '14%', left: '4%', size: 42, duration: '9.2s', delay: '0.4s', rotate: -12 },
  { id: 'seven', kind: 'seven', top: '18%', left: '88%', size: 36, duration: '8.4s', delay: '0.7s', rotate: 8 },
  { id: 'chip-g', kind: 'chip-gold', top: '42%', left: '6%', size: 34, duration: '10.1s', delay: '1.1s', rotate: 0 },
  { id: 'king', kind: 'king-heart', top: '58%', left: '91%', size: 40, duration: '9.6s', delay: '0.9s', rotate: 14, desktopOnly: true },
  { id: 'dice', kind: 'dice', top: '72%', left: '8%', size: 30, duration: '8.8s', delay: '1.6s', rotate: -18, desktopOnly: true },
  { id: 'cherry', kind: 'cherry', top: '36%', left: '93%', size: 28, duration: '7.8s', delay: '1.4s', rotate: 10, desktopOnly: true },
  { id: 'queen', kind: 'queen-diamond', top: '78%', left: '78%', size: 38, duration: '10.4s', delay: '0.5s', rotate: -8, desktopOnly: true },
  { id: 'star', kind: 'star', top: '28%', left: '16%', size: 22, duration: '7.2s', delay: '2s', rotate: 0 },
  { id: 'chip-r', kind: 'chip-red', top: '84%', left: '28%', size: 26, duration: '9s', delay: '1.8s', rotate: 0, desktopOnly: true },
  { id: 'jack', kind: 'jack-club', top: '8%', left: '62%', size: 34, duration: '8.6s', delay: '2.2s', rotate: 16, desktopOnly: true },
  { id: 'diamond', kind: 'diamond', top: '62%', left: '3%', size: 20, duration: '7.6s', delay: '1.2s', rotate: 0, desktopOnly: true },
  { id: 'bell', kind: 'bell', top: '48%', left: '84%', size: 24, duration: '8.1s', delay: '2.4s', rotate: -6, desktopOnly: true },
  { id: 'coin', kind: 'coin', top: '88%', left: '52%', size: 22, duration: '9.4s', delay: '0.8s', rotate: 0 },
  { id: 'hex', kind: 'hex', top: '22%', left: '38%', size: 48, duration: '12s', delay: '1.5s', rotate: 20, desktopOnly: true },
];

function PlayingCard({ rank, suit, color }: { rank: string; suit: string; color: string }) {
  return (
    <svg viewBox="0 0 48 68" fill="none" aria-hidden="true">
      <rect width="48" height="68" rx="6" fill="rgba(10,12,20,0.55)" stroke="rgba(255,255,255,0.2)" />
      <text x="8" y="16" fill={color} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
        {rank}
      </text>
      <text x="24" y="40" fill={color} fontSize="18" textAnchor="middle" fontFamily="serif">
        {suit}
      </text>
      <text
        x="40"
        y="60"
        fill={color}
        fontSize="11"
        fontWeight="700"
        textAnchor="end"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {rank}
      </text>
    </svg>
  );
}

function Chip({ tone }: { tone: 'gold' | 'red' }) {
  const fill = tone === 'gold' ? '#d4a017' : '#c23b4a';
  const inner = tone === 'gold' ? '#f3d27a' : '#ef6b78';
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill={fill} opacity="0.72" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.55)" strokeDasharray="3 3" />
      <circle cx="20" cy="20" r="9" fill={inner} opacity="0.85" />
    </svg>
  );
}

function DiceMark() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.22)" />
      <circle cx="11" cy="11" r="2.4" fill="rgba(255,255,255,0.7)" />
      <circle cx="25" cy="11" r="2.4" fill="rgba(255,255,255,0.7)" />
      <circle cx="18" cy="18" r="2.4" fill="rgba(255,255,255,0.7)" />
      <circle cx="11" cy="25" r="2.4" fill="rgba(255,255,255,0.7)" />
      <circle cx="25" cy="25" r="2.4" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

function SevenMark() {
  return (
    <svg viewBox="0 0 36 40" fill="none" aria-hidden="true">
      <text
        x="18"
        y="32"
        textAnchor="middle"
        fill="#f3c14b"
        fontSize="32"
        fontWeight="800"
        fontFamily="Cinzel, Georgia, serif"
      >
        7
      </text>
    </svg>
  );
}

function CherryMark() {
  return (
    <svg viewBox="0 0 32 36" fill="none" aria-hidden="true">
      <path d="M16 6 C16 14 10 16 8 20" stroke="#4ade80" strokeWidth="1.8" />
      <path d="M16 6 C18 14 24 16 25 20" stroke="#4ade80" strokeWidth="1.8" />
      <circle cx="8.5" cy="25" r="6" fill="#e11d48" opacity="0.8" />
      <circle cx="24.5" cy="24" r="6" fill="#be123c" opacity="0.8" />
    </svg>
  );
}

function StarMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.4l2.4 6.4 6.8.4-5.2 4.4 1.8 6.6L12 16.6 6.2 20.2l1.8-6.6L2.8 9.2l6.8-.4L12 2.4z"
        fill="#fbbf24"
        opacity="0.72"
      />
    </svg>
  );
}

function DiamondMark() {
  return (
    <svg viewBox="0 0 22 28" fill="none" aria-hidden="true">
      <path d="M11 1.5 L20.5 11 L11 26.5 L1.5 11 Z" fill="#67e8f9" opacity="0.55" />
    </svg>
  );
}

function BellMark() {
  return (
    <svg viewBox="0 0 28 30" fill="none" aria-hidden="true">
      <path
        d="M14 3c-5 0-8 4.2-8 9.2V18l-2.5 3.2c-.4.5 0 1.3.7 1.3h19.6c.7 0 1.1-.8.7-1.3L22 18v-5.8C22 7.2 19 3 14 3z"
        fill="#f59e0b"
        opacity="0.65"
      />
      <circle cx="14" cy="25.5" r="2.2" fill="#fbbf24" />
    </svg>
  );
}

function CoinMark() {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="#eab308" opacity="0.62" />
      <circle cx="14" cy="14" r="8.5" fill="none" stroke="rgba(255,255,255,0.45)" />
      <text
        x="14"
        y="18"
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontSize="11"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  );
}

function HexMark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z"
        stroke="rgba(167,139,250,0.35)"
        strokeWidth="1.2"
        fill="rgba(124,58,237,0.06)"
      />
    </svg>
  );
}

export function FloatGlyph({ kind }: { kind: FloatKind }) {
  switch (kind) {
    case 'ace-spade':
      return <PlayingCard rank="A" suit="♠" color="#e5e7eb" />;
    case 'king-heart':
      return <PlayingCard rank="K" suit="♥" color="#f87171" />;
    case 'queen-diamond':
      return <PlayingCard rank="Q" suit="♦" color="#fb7185" />;
    case 'jack-club':
      return <PlayingCard rank="J" suit="♣" color="#e5e7eb" />;
    case 'chip-gold':
      return <Chip tone="gold" />;
    case 'chip-red':
      return <Chip tone="red" />;
    case 'dice':
      return <DiceMark />;
    case 'seven':
      return <SevenMark />;
    case 'cherry':
      return <CherryMark />;
    case 'star':
      return <StarMark />;
    case 'diamond':
      return <DiamondMark />;
    case 'bell':
      return <BellMark />;
    case 'coin':
      return <CoinMark />;
    case 'hex':
      return <HexMark />;
    default:
      return null;
  }
}

interface FloatingGamingElementsProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  parallax: boolean;
}

export function FloatingGamingElements({ x, y, parallax }: FloatingGamingElementsProps) {
  const shiftX = useTransform(x, [-1, 1], [14, -14]);
  const shiftY = useTransform(y, [-1, 1], [10, -10]);

  return (
    <motion.div
      className="home-atmosphere-layer home-atmosphere-mid"
      style={parallax ? { x: shiftX, y: shiftY } : undefined}
    >
      {FLOATS.map((item) => (
        <span
          key={item.id}
          className={item.desktopOnly ? 'home-float-el home-float-desktop' : 'home-float-el'}
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            height: item.size,
            animationDuration: item.duration,
            animationDelay: item.delay,
            ['--float-rotate' as string]: `${item.rotate}deg`,
          }}
        >
          <FloatGlyph kind={item.kind} />
        </span>
      ))}
    </motion.div>
  );
}
