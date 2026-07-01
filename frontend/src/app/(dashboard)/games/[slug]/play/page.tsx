'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, RotateCcw, MessageSquare, Eye, Clock, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TicTacToeBoard } from '@/components/game/TicTacToeBoard';
import { ConnectFourBoard } from '@/components/game/ConnectFourBoard';
import { ChessBoard } from '@/components/game/ChessBoard';
import { GameOverModal } from '@/components/game/GameOverModal';
import { useAuthStore } from '@/store/auth.store';
import { useGameStore } from '@/store/game.store';
import { useGameSocket, useChatSocket } from '@/socket/hooks';

export default function PlayPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuthStore();
  const {
    gameState,
    players,
    spectators,
    isPlaying,
    countdown,
    isMatchmaking,
    currentRoom,
  } = useGameStore();
  const { joinRoom, leaveRoom, makeMove, surrender, startMatchmaking, cancelMatchmaking } = useGameSocket();
  const { sendMessage: sendChatMessage } = useChatSocket();

  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const roomId = currentRoom?.id || '';
  const gameStatus = gameState?.status || (isMatchmaking ? 'waiting' : 'waiting');
  const me = players.find((p) => p.userId === user?.id);
  const opponent = players.find((p) => p.userId !== user?.id);

  useEffect(() => {
    startMatchmaking(slug);
    return () => {
      if (roomId) leaveRoom(roomId);
      else cancelMatchmaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleMakeMove = (position: { row: number; col: number } | number) => {
    if (!roomId) return;
    makeMove({ position, roomId });
  };

  const handleSurrender = () => {
    if (roomId) surrender(roomId);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { user: user?.username || 'You', text: chatInput }]);
    if (roomId) sendChatMessage(roomId, chatInput);
    setChatInput('');
  };

  const handleGameEnd = (winnerId: string | null) => {
    void winnerId;
  };

  const formatTime = (seconds?: number) => {
    if (seconds == null) return '5:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderBoard = () => {
    const disabled = gameStatus !== 'playing';
    const board = gameState?.board;
    switch (slug) {
      case 'tic-tac-toe':
        return <TicTacToeBoard board={board} onMove={handleMakeMove} onGameEnd={handleGameEnd} disabled={disabled} />;
      case 'connect-four':
        return <ConnectFourBoard board={board} onMove={handleMakeMove} onGameEnd={handleGameEnd} disabled={disabled} />;
      case 'chess':
        return <ChessBoard board={board} onMove={handleMakeMove} onGameEnd={handleGameEnd} disabled={disabled} />;
      default:
        return <TicTacToeBoard board={board} onMove={handleMakeMove} onGameEnd={handleGameEnd} disabled={disabled} />;
    }
  };

  const eloChange = gameState?.winner === user?.id ? 15 : gameState?.winner ? -10 : 0;

  if (isMatchmaking && !currentRoom) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-primary-400" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Finding a match...</h2>
            <p className="text-gray-400">Looking for an opponent for {slug.replace(/-/g, ' ')}</p>
          </div>
          <Button variant="outline" onClick={cancelMatchmaking}>Cancel</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Countdown Overlay */}
        <AnimatePresence>
          {gameStatus === 'countdown' && countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            >
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-8xl font-display font-bold text-primary-400"
              >
                {countdown || 'GO!'}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Panels */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <Card className="flex items-center gap-3 border-primary-500/30">
            <Avatar name={user?.username} size="md" online />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{me?.username || user?.username || 'You'}</p>
              <p className="text-xs text-gray-400">{me?.elo || user?.elo || 1000} ELO</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-primary-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(gameState?.timeLeft?.[user?.id || ''])}</span>
            </div>
          </Card>

          <div className="text-center">
            <Badge variant="purple">VS</Badge>
          </div>

          <Card className="flex items-center gap-3 border-secondary-500/30">
            <Avatar name={opponent?.username || 'Waiting...'} size="md" online={!!opponent} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{opponent?.username || 'Waiting...'}</p>
              <p className="text-xs text-gray-400">{opponent?.elo || '---'} ELO</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(gameState?.timeLeft?.[opponent?.userId || ''])}</span>
            </div>
          </Card>
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <Card className="flex items-center justify-center min-h-[400px]">
            {renderBoard()}
          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            <Card>
              <div className="flex flex-col gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Flag className="w-4 h-4" />}
                  className="w-full"
                  onClick={handleSurrender}
                  disabled={gameStatus !== 'playing'}
                >
                  Surrender
                </Button>
                <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} className="w-full" disabled={gameStatus !== 'playing'}>
                  Offer Draw
                </Button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{spectators.length} Spectator{spectators.length !== 1 ? 's' : ''}</span>
              </div>
            </Card>

            <Card className="flex flex-col h-64">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium text-primary-400">{msg.user}: </span>
                    <span className="text-gray-300">{msg.text}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-xs text-gray-500 text-center mt-4">No messages yet</p>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface-light border border-surface-lighter rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button size="sm" onClick={handleSendChat}>Send</Button>
              </div>
            </Card>
          </div>
        </div>

        <GameOverModal
          isOpen={gameStatus === 'finished'}
          winner={gameState?.winner || null}
          currentUser={user?.id || ''}
          eloChange={eloChange}
          onPlayAgain={() => startMatchmaking(slug)}
          onClose={() => {}}
        />
      </div>
    </DashboardLayout>
  );
}
