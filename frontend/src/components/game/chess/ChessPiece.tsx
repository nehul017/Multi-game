'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ChessPieceColor = 'white' | 'black';
export type ChessPieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

interface ChessPieceProps {
  type: string;
  color: ChessPieceColor;
  selected?: boolean;
  hovered?: boolean;
  capturing?: boolean;
  promoting?: boolean;
  lifted?: boolean;
  className?: string;
  size?: number | string;
}

const PIECE_SRC: Record<ChessPieceColor, Record<ChessPieceType, string>> = {
  white: {
    king: '/chess/pieces/w-king.png',
    queen: '/chess/pieces/w-queen.png',
    rook: '/chess/pieces/w-rook.png',
    bishop: '/chess/pieces/w-bishop.png',
    knight: '/chess/pieces/w-knight.png',
    pawn: '/chess/pieces/w-pawn.png',
  },
  black: {
    king: '/chess/pieces/b-king.png',
    queen: '/chess/pieces/b-queen.png',
    rook: '/chess/pieces/b-rook.png',
    bishop: '/chess/pieces/b-bishop.png',
    knight: '/chess/pieces/b-knight.png',
    pawn: '/chess/pieces/b-pawn.png',
  },
};

function normalizeType(type: string): ChessPieceType {
  return (['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'].includes(type)
    ? type
    : 'pawn') as ChessPieceType;
}

function PieceSprite({
  type,
  color,
  className,
  priority,
}: {
  type: ChessPieceType;
  color: ChessPieceColor;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PIECE_SRC[color][type]}
      alt=""
      draggable={false}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      className={cn(
        'pointer-events-none select-none object-contain object-bottom',
        'w-full h-full [image-rendering:auto]',
        className
      )}
    />
  );
}

function ContactShadow({
  elevated,
  strong,
}: {
  elevated?: boolean;
  strong?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 bottom-[2%] -translate-x-1/2 rounded-[100%] transition-all duration-200"
      style={{
        width: strong ? '78%' : elevated ? '72%' : '68%',
        height: strong ? '14%' : elevated ? '11%' : '9%',
        background:
          'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0) 72%)',
        filter: strong ? 'blur(3px)' : elevated ? 'blur(2px)' : 'blur(1.5px)',
        opacity: strong ? 0.95 : elevated ? 0.8 : 0.7,
        transform: `translateX(-50%) scaleY(${strong ? 1.15 : 1})`,
      }}
    />
  );
}

function CaptureParticles({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-amber-100/85"
            initial={{ opacity: 0.95, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * 24,
              y: Math.sin(angle) * 18,
              scale: 0.15,
            }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}

function PromotionSparkles({ active }: { active?: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.span
            className="pointer-events-none absolute inset-[-20%] rounded-full"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: [0.9, 0.35, 0], scale: [0.65, 1.3, 1.45] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              background:
                'radial-gradient(circle, rgba(255,224,138,0.6) 0%, rgba(212,175,55,0.22) 48%, transparent 72%)',
            }}
          />
          {Array.from({ length: 6 }, (_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-amber-200"
              style={{ left: '50%', top: '32%' }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos((i / 6) * Math.PI * 2) * 18,
                y: Math.sin((i / 6) * Math.PI * 2) * 14 - 8,
                scale: 0,
              }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.04 * i }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

export function ChessPiece({
  type,
  color,
  selected,
  hovered,
  capturing,
  promoting,
  lifted,
  className,
}: ChessPieceProps) {
  const pieceType = normalizeType(type);
  const isElevated = Boolean(lifted || selected || hovered);

  return (
    <motion.div
      className={cn(
        'relative w-full h-full flex items-end justify-center will-change-transform transform-gpu',
        className
      )}
      initial={false}
      animate={
        capturing
          ? {
              y: '-4%',
              scale: 0.12,
              opacity: 0,
              rotate: 6,
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))',
            }
          : promoting
            ? {
                y: ['0%', '-10%', '0%'],
                scale: [0.55, 1.14, 1],
                opacity: 1,
                rotate: 0,
                filter:
                  'drop-shadow(0 0 16px rgba(212,175,55,0.9)) drop-shadow(0 14px 18px rgba(0,0,0,0.42))',
              }
            : lifted
              ? {
                  y: '-18%',
                  scale: 1.06,
                  opacity: 1,
                  rotate: -2,
                  filter: 'drop-shadow(0 22px 28px rgba(0,0,0,0.45))',
                }
              : selected || hovered
                ? {
                    y: '-6%',
                    scale: 1.04,
                    opacity: 1,
                    rotate: 0,
                    filter:
                      'drop-shadow(0 0 10px rgba(255,247,230,0.35)) drop-shadow(0 14px 22px rgba(0,0,0,0.32))',
                  }
                : {
                    y: ['0%', '-1.5%', '0%'],
                    scale: 1,
                    opacity: 1,
                    rotate: 0,
                    filter:
                      'drop-shadow(0 8px 14px rgba(0,0,0,0.26)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }
      }
      whileHover={
        lifted || capturing
          ? undefined
          : {
              y: '-6%',
              scale: 1.04,
              filter:
                'drop-shadow(0 0 10px rgba(255,247,230,0.28)) drop-shadow(0 14px 22px rgba(0,0,0,0.32))',
              transition: { duration: 0.2, ease: 'easeOut' },
            }
      }
      transition={
        capturing
          ? { duration: 0.35, ease: 'easeOut' }
          : promoting
            ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
            : lifted
              ? { type: 'spring', stiffness: 360, damping: 22 }
              : isElevated
                ? { duration: 0.2, ease: 'easeOut' }
                : {
                    y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                    default: { duration: 0.25 },
                  }
      }
    >
      <ContactShadow elevated={isElevated} strong={lifted} />
      <CaptureParticles active={capturing} />
      <PromotionSparkles active={promoting} />
      <span className="relative z-[1] flex h-full w-full items-end justify-center">
        <PieceSprite type={pieceType} color={color} priority={selected || lifted} />
      </span>
    </motion.div>
  );
}

export function ChessPieceIcon({
  type,
  color,
  className,
}: {
  type: string;
  color: ChessPieceColor;
  className?: string;
}) {
  const pieceType = normalizeType(type);

  return (
    <span className={cn('inline-flex w-5 h-5 sm:w-6 sm:h-6 transform-gpu', className)}>
      <PieceSprite type={pieceType} color={color} />
    </span>
  );
}
