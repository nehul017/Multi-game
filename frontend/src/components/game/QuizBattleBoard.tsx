'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
  points: number;
}

interface PlayerScore {
  playerId: string;
  score: number;
  correctAnswers: number;
}

interface QuizState {
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  scores: PlayerScore[];
}

export interface QuizBattleBoardProps {
  board?: unknown;
  disabled?: boolean;
  onAnswer?: (answer: number) => void;
}

export function QuizBattleBoard({ board, disabled, onAnswer }: QuizBattleBoardProps) {
  const state = (board || {
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 0,
    scores: [],
  }) as QuizState;

  const q = state.currentQuestion;

  if (!q) {
    return (
      <div className="text-center text-theme-muted py-12">
        Waiting for the next question...
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl space-y-4 sm:space-y-5 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-theme-muted">
        <span>
          Question {state.questionNumber}/{state.totalQuestions}
        </span>
        <span className="capitalize">
          {q.category} · {q.difficulty} · {q.points} pts
        </span>
      </div>

      <motion.h3
        key={q.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg sm:text-xl font-display font-bold text-theme-primary"
      >
        {q.question}
      </motion.h3>

      <div className="grid gap-2.5 sm:gap-3">
        {q.options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer?.(index)}
            className={cn(
              'text-left px-3 sm:px-4 py-3 rounded-2xl border border-theme bg-theme-secondary',
              'hover:border-primary-500/50 hover:bg-primary-500/10 transition',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span className="text-primary-500 font-semibold mr-2">
              {String.fromCharCode(65 + index)}.
            </span>
            <span className="text-theme-primary break-words">{option}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {state.scores?.map((s) => (
          <div key={s.playerId} className="text-xs px-3 py-1.5 rounded-full border border-theme">
            <span className="text-theme-muted">{s.playerId.slice(-6)}: </span>
            <span className="text-theme-primary font-semibold">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
