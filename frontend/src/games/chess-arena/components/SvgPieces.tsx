import type { ChessColor, ChessPieceType } from '../types';

interface SvgPieceProps {
  type: ChessPieceType;
  color: ChessColor;
}

export function SvgPiece({ type, color }: SvgPieceProps) {
  const isWhite = color === 'white';
  const fill = isWhite ? '#f4efe6' : '#1a1224';
  const stroke = isWhite ? '#4c1d95' : '#c4b5fd';
  const accent = isWhite ? '#7c3aed' : '#a78bfa';

  return (
    <svg viewBox="0 0 64 80" className="w-full h-full" aria-hidden>
      {type === 'pawn' && (
        <>
          <ellipse cx="32" cy="70" rx="16" ry="5" fill="rgba(0,0,0,0.22)" />
          <path d="M18 68h28c2 0 4-2 4-4v-2c0-8-8-12-14-14 6-3 10-9 10-16 0-10-8-18-18-18S10 22 10 32c0 7 4 13 10 16-6 2-14 6-14 14v2c0 2 2 4 4 4z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <circle cx="32" cy="24" r="8" fill={accent} opacity="0.35" />
        </>
      )}
      {type === 'knight' && (
        <>
          <ellipse cx="32" cy="70" rx="18" ry="5" fill="rgba(0,0,0,0.22)" />
          <path d="M14 68h34c3 0 4-3 3-5l-4-10c8-6 11-16 8-26-2-8-10-14-18-16L24 6l2 12c-8 2-16 10-16 20 0 8 4 14 10 18l-4 7c-2 3 0 5 2 5z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <circle cx="28" cy="26" r="2.2" fill={stroke} />
        </>
      )}
      {type === 'bishop' && (
        <>
          <ellipse cx="32" cy="70" rx="17" ry="5" fill="rgba(0,0,0,0.22)" />
          <path d="M18 68h28v-4c0-8-8-12-12-16 10-10 14-20 10-28-3-6-10-10-14-10s-11 4-14 10c-4 8 0 18 10 28-4 4-12 8-12 16v4z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <path d="M32 14l4 10-4 4-4-4z" fill={accent} />
          <path d="M29 28l6 14" stroke={stroke} strokeWidth="1.4" />
        </>
      )}
      {type === 'rook' && (
        <>
          <ellipse cx="32" cy="70" rx="18" ry="5" fill="rgba(0,0,0,0.22)" />
          <path d="M14 68h36v-6H14zm4-6h28V36H18zm-4-32h8v-8h6v8h8v-8h6v8h8v10H14z" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
        </>
      )}
      {type === 'queen' && (
        <>
          <ellipse cx="32" cy="70" rx="19" ry="5" fill="rgba(0,0,0,0.22)" />
          <path d="M14 68h36l-2-10H16zM16 54l4-26 8 16 4-22 4 22 8-16 4 26z" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="16" cy="26" r="3" fill={accent} />
          <circle cx="32" cy="14" r="3.2" fill={accent} />
          <circle cx="48" cy="26" r="3" fill={accent} />
        </>
      )}
      {type === 'king' && (
        <>
          <ellipse cx="32" cy="70" rx="19" ry="5" fill="rgba(0,0,0,0.22)" />
          <path d="M16 68h32l-2-12H18zM18 52c0-10 6-16 14-18 8 2 14 8 14 18z" fill={fill} stroke={stroke} strokeWidth="1.6" />
          <path d="M32 8v18M24 16h16" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
