'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SUIT_GLYPH, type MindiCompletedTrick, type MindiTeam } from '../types';

interface TeamScore {
  tens: number;
  tricks: number;
}

interface MindiScoreBoardProps {
  teamA: TeamScore;
  teamB: TeamScore;
  lastTrick?: MindiCompletedTrick | null;
}

export function MindiScoreBoard({ teamA, teamB, lastTrick }: MindiScoreBoardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mindi-scoreboard">
      <TeamChip team="A" score={teamA} />
      <span className="mindi-vs" aria-hidden>
        VS
      </span>
      <TeamChip team="B" score={teamB} />
      {lastTrick && (
        <div className="mindi-history">
          <button
            type="button"
            className="mindi-history-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            Last trick
            <ChevronDown className={`w-3.5 h-3.5 ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <p className="mindi-history-body">
              Trick {lastTrick.trickNumber} · Team {lastTrick.team} · {lastTrick.winningCard.rank}
              {SUIT_GLYPH[lastTrick.winningCard.suit]}
              {lastTrick.tens.length > 0 ? ` · ${lastTrick.tens.length} ten${lastTrick.tens.length === 1 ? '' : 's'}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TeamChip({ team, score }: { team: MindiTeam; score: TeamScore }) {
  return (
    <div className={`mindi-team-chip is-${team.toLowerCase()}`} aria-label={`Team ${team} score`}>
      <span className="mindi-kicker">Team {team}</span>
      <strong>
        10s {score.tens}
        <span aria-hidden> · </span>
        Tricks {score.tricks}
      </strong>
    </div>
  );
}
