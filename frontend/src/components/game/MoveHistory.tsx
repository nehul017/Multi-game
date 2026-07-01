'use client';

import { Move } from '@/types';
import { cn } from '@/lib/utils';

interface MoveHistoryProps {
  moves: Move[];
  className?: string;
}

export function MoveHistory({ moves, className }: MoveHistoryProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <h4 className="text-sm font-semibold text-white mb-2">Move History</h4>
      <div className="flex-1 overflow-y-auto space-y-1 max-h-48">
        {moves.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No moves yet</p>
        ) : (
          moves.map((move, i) => (
            <div key={move.id || i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-surface-light/50">
              <span className="text-gray-500 w-6">{i + 1}.</span>
              <span className="text-gray-300">{move.notation || JSON.stringify(move.position)}</span>
              <span className="text-gray-500 ml-auto text-[10px]">
                {new Date(move.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
