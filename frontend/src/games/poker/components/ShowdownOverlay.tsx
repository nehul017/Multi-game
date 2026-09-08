'use client';

import type { ShowdownResult } from '../types';
import { WinnerDisplay } from './WinnerDisplay';

export function ShowdownOverlay({ showdown }: { showdown: ShowdownResult | null }) {
  if (!showdown) return null;
  const high = showdown.revealedPlayers.filter((player) => showdown.highWinners.includes(player.userId));
  const low = showdown.revealedPlayers.filter((player) => showdown.lowWinners.includes(player.userId));

  return (
    <div className="pk-showdown">
      <WinnerDisplay showdown={showdown} />
      {low.length > 0 && (
        <div className="pk-showdown-split">
          <div>
            <p>HIGH WINNER</p>
            {high.map((player) => (
              <strong key={player.userId}>
                {player.username} · {player.handName}
              </strong>
            ))}
          </div>
          <div>
            <p>LOW WINNER</p>
            {low.map((player) => (
              <strong key={player.userId}>
                {player.username} · {player.lowHandName}
              </strong>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
