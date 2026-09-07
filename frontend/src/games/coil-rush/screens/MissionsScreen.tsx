'use client';

import { useMissions, useClaimMission } from '@/hooks';
import { COIL_MISSIONS } from '../progression/rewards';
import type { Mission } from '@/types';

interface MissionsScreenProps {
  onBack: () => void;
}

export function MissionsScreen({ onBack }: MissionsScreenProps) {
  const { data } = useMissions();
  const claim = useClaimMission();
  const live = Array.isArray(data?.data) ? data.data : [];
  const items = live.length
    ? live.map((mission: Mission) => ({
        id: mission.id,
        title: mission.title,
        detail: mission.description,
        reward: `${mission.coinReward || 0} coins · ${mission.xpReward || 0} XP`,
        progress: mission.target ? mission.progress / mission.target : 0,
        claimable: mission.completed && !mission.claimed,
      }))
    : COIL_MISSIONS.map((mission) => ({ ...mission, claimable: false }));

  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Missions</h2>
      <div className="coil-mission-list">
        {items.map((mission) => (
          <article key={mission.id} className="coil-mission">
            <div>
              <strong>{mission.title}</strong>
              <p>{mission.detail}</p>
              <em>{mission.reward}</em>
              <b style={{ width: `${Math.min(100, (mission.progress || 0) * 100)}%` }} />
            </div>
            {mission.claimable && (
              <button type="button" className="coil-ghost" onClick={() => claim.mutate(mission.id)}>
                Claim
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
