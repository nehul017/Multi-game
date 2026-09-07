'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChessRules } from '../engine/chessRules';
import { chessEnginePort } from '../engine/analysis';
import { DEFAULT_CHESS_SETTINGS } from '../config';
import { chessSettings } from '../storage/settings';
import { ChessBoard } from '../components/ChessBoard';
import { ChessMoveHistory } from '../components/ChessMoveHistory';
import type { ChessSanMove } from '../types';

interface AnalyzeScreenProps {
  pgn: string;
  onBack: () => void;
}

export function AnalyzeScreen({ pgn, onBack }: AnalyzeScreenProps) {
  const [ply, setPly] = useState(0);
  const settings = chessSettings.get();
  const history = useMemo(() => {
    const rules = ChessRules.fromPgn(pgn);
    return rules.history();
  }, [pgn]);

  const position = useMemo(() => {
    const rules = new ChessRules();
    history.slice(0, ply).forEach((move) => {
      rules.game.move(move.san);
    });
    return rules;
  }, [history, ply]);

  const engineReady = chessEnginePort.isAvailable();

  return (
    <section className="cx-screen cx-analyze">
      <button type="button" className="cx-back" onClick={onBack}>Back</button>
      <h2>Analyze</h2>
      <div className="cx-analyze-grid">
        <ChessBoard
          board={position.board()}
          orientation="white"
          playerColor="both"
          disabled
          settings={{ ...DEFAULT_CHESS_SETTINGS, ...settings }}
          lastMove={history[ply - 1] ? { from: squarePos(history[ply - 1].from), to: squarePos(history[ply - 1].to) } : null}
          onMove={() => false}
          legalTargets={() => []}
        />
        <div className="space-y-3">
          <div className="cx-eval">
            <div className="cx-eval-bar" aria-hidden>
              <span style={{ height: '50%' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-theme-primary">Evaluation</p>
              <p className="text-xs text-theme-muted">
                {engineReady
                  ? 'Engine connected.'
                  : 'No chess engine is connected. Best move, mistakes, and accuracy stay hidden until Stockfish (or another engine) is wired in.'}
              </p>
            </div>
          </div>
          <ChessMoveHistory moves={history} activePly={ply - 1} onSelectPly={(next) => setPly(next + 1)} pgn={pgn} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPly((v) => Math.max(0, v - 1))}>Previous</Button>
            <Button variant="secondary" onClick={() => setPly((v) => Math.min(history.length, v + 1))}>Next</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function squarePos(square: string) {
  return { col: 'abcdefgh'.indexOf(square[0]), row: 8 - Number(square[1]) };
}

export type { ChessSanMove };
