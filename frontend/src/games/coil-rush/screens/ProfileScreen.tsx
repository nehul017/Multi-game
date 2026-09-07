'use client';

import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { coilProgress } from '../progression/storage';
import { skinById } from '../progression/skins';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user } = useAuthStore();
  const skin = skinById(coilProgress.getSkin());
  const local = coilProgress.getStats();

  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Rider profile</h2>
      <div className="coil-profile">
        <Avatar name={user?.username || 'Rider'} src={user?.avatar} size="lg" />
        <strong>{user?.username}</strong>
        <span>Level {user?.level ?? 1} · {user?.xp ?? 0} XP</span>
        <ul>
          <li>Games {user?.gamesPlayed ?? local.games}</li>
          <li>Wins {user?.wins ?? local.wins}</li>
          <li>Best coil {coilProgress.getBest()}</li>
          <li>Food eaten {local.food}</li>
          <li>Coils cut {local.kills}</li>
          <li>Favorite skin {skin.name}</li>
        </ul>
      </div>
    </section>
  );
}
