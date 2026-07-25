'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface MatchmakingProps {
  isSearching: boolean;
  onCancel: () => void;
  gameSlug: string;
}

export function Matchmaking({ isSearching, onCancel, gameSlug }: MatchmakingProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isSearching]);

  if (!isSearching) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="text-center py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4"
      />
      <div className="flex items-center justify-center gap-2 mb-2">
        <Search className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-theme-primary">Finding Match...</h3>
      </div>
      <p className="text-sm text-theme-muted mb-1">Searching for opponents in {gameSlug}</p>
      <p className="text-xs text-theme-muted mb-6 font-mono">{formatTime(elapsed)}</p>
      <Button variant="outline" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={onCancel}>
        Cancel
      </Button>
    </Card>
  );
}
