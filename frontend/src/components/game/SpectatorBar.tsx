'use client';

import { Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface SpectatorBarProps {
  spectators: Array<{ id: string; username: string }>;
}

export function SpectatorBar({ spectators }: SpectatorBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-light/50 border border-surface-lighter/30">
      <Eye className="w-4 h-4 text-gray-400" />
      <span className="text-xs text-gray-400">{spectators.length} watching</span>
      <div className="flex -space-x-2 ml-2">
        {spectators.slice(0, 5).map((s) => (
          <Avatar key={s.id} name={s.username} size="xs" />
        ))}
        {spectators.length > 5 && (
          <span className="w-6 h-6 rounded-full bg-surface-lighter flex items-center justify-center text-[10px] text-gray-400 border-2 border-surface">
            +{spectators.length - 5}
          </span>
        )}
      </div>
    </div>
  );
}
