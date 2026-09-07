'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { CHESS_BRAND } from './brand';
import { chessAudio } from './audio/chessAudio';
import { HubMenu } from './screens/HubMenu';
import { ModesScreen } from './screens/ModesScreen';
import { ComputerScreen } from './screens/ComputerScreen';
import { RoomsScreen } from './screens/RoomsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AnalyzeScreen } from './screens/AnalyzeScreen';
import { ChessMatchView } from './play/ChessMatchView';
import type { ChessDifficulty, ChessPlayMode, ChessView } from './types';

interface ChessAppProps {
  variant: 'hub' | 'play';
}

const VIEWS = new Set<ChessView>(['menu', 'modes', 'computer', 'rooms', 'settings', 'analyze']);
const MODES = new Set<ChessPlayMode>(['quick', 'ranked', 'casual', 'computer', 'local', 'private']);
const DIFFS = new Set<ChessDifficulty>(['beginner', 'easy', 'medium', 'hard', 'expert']);

function readQuery() {
  if (typeof window === 'undefined') {
    return { view: 'menu' as ChessView, mode: 'computer' as ChessPlayMode, time: 300, difficulty: 'medium' as ChessDifficulty, room: '', pgn: '' };
  }
  const q = new URLSearchParams(window.location.search);
  const view = q.get('view') as ChessView;
  const mode = q.get('mode') as ChessPlayMode;
  const difficulty = q.get('diff') as ChessDifficulty;
  const time = Number(q.get('time') || 300);
  return {
    view: VIEWS.has(view) ? view : 'menu',
    mode: MODES.has(mode) ? mode : 'computer',
    time: [60, 180, 300, 600].includes(time) ? time : 300,
    difficulty: DIFFS.has(difficulty) ? difficulty : 'medium',
    room: q.get('room') || '',
    pgn: q.get('pgn') || '',
  };
}

export function ChessApp({ variant }: ChessAppProps) {
  return (
    <AuthGuard>
      <ChessInner variant={variant} />
    </AuthGuard>
  );
}

function ChessInner({ variant }: ChessAppProps) {
  const router = useRouter();
  const query = useMemo(() => readQuery(), []);
  const { user } = useAuthStore();
  const [view, setView] = useState<ChessView>(query.view);
  const [analyzePgn] = useState(() => {
    if (query.pgn) return query.pgn;
    if (typeof window !== 'undefined') return sessionStorage.getItem('chess-analyze-pgn') || '';
    return '';
  });

  const goPlay = (mode: ChessPlayMode, extras?: { time?: number; difficulty?: ChessDifficulty; room?: string }) => {
    chessAudio.unlock();
    chessAudio.play('click');
    const params = new URLSearchParams({ mode });
    if (extras?.time) params.set('time', String(extras.time));
    if (extras?.difficulty) params.set('diff', extras.difficulty);
    if (extras?.room) params.set('room', extras.room);
    router.push(`/games/${CHESS_BRAND.slug}/play?${params.toString()}`);
  };

  if (variant === 'play') {
    return (
      <div className="cx-root">
        <ChessMatchView
          mode={query.mode}
          timeSeconds={query.time}
          difficulty={query.difficulty}
          room={query.room}
          onAnalyze={(pgn) => {
            if (typeof window !== 'undefined') sessionStorage.setItem('chess-analyze-pgn', pgn);
            router.push(`/games/${CHESS_BRAND.slug}?view=analyze`);
          }}
        />
      </div>
    );
  }

  let body = (
    <HubMenu
      username={user?.username}
      rating={user?.elo}
      onPlay={(mode) => {
        if (mode === 'computer') goPlay('computer', { difficulty: 'medium', time: 300 });
        else goPlay(mode);
      }}
      onOpen={setView}
      onDashboard={() => router.push('/games')}
    />
  );

  if (view === 'modes') {
    body = (
      <ModesScreen
        onBack={() => setView('menu')}
        onSelect={(mode, seconds) => goPlay(mode, { time: seconds })}
      />
    );
  } else if (view === 'computer') {
    body = (
      <ComputerScreen
        onBack={() => setView('menu')}
        onSelect={(difficulty, seconds) => goPlay('computer', { difficulty, time: seconds })}
      />
    );
  } else if (view === 'rooms') {
    body = (
      <RoomsScreen
        onBack={() => setView('menu')}
        onCreate={(roomId) => goPlay('private', { room: roomId })}
      />
    );
  } else if (view === 'settings') {
    body = <SettingsScreen onBack={() => setView('menu')} />;
  } else if (view === 'analyze') {
    body = <AnalyzeScreen pgn={analyzePgn} onBack={() => setView('menu')} />;
  }

  return <div className="cx-root">{body}</div>;
}
