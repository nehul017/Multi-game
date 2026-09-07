'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { COIL_SKINS, isSkinUnlocked } from '../progression/skins';
import { coilProgress } from '../progression/storage';
import type { CoilSkinCategory } from '../types';

const CATS: CoilSkinCategory[] = ['classic', 'animals', 'robots', 'fantasy', 'space', 'funny', 'legendary'];

interface SkinsScreenProps {
  equipped: string;
  onBack: () => void;
  onEquip: (id: string) => void;
}

export function SkinsScreen({ equipped, onBack, onEquip }: SkinsScreenProps) {
  const [cat, setCat] = useState<CoilSkinCategory>('classic');
  const { user } = useAuthStore();
  const stats = coilProgress.getStats();
  const ctx = { best: coilProgress.getBest(), games: stats.games, kills: stats.kills, level: user?.level ?? 1 };
  const skins = useMemo(
    () => COIL_SKINS.filter((skin) => skin.category === cat).map((skin) => ({ ...skin, unlocked: isSkinUnlocked(skin, ctx) })),
    [cat, ctx.best, ctx.games, ctx.kills, ctx.level]
  );

  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Coil skins</h2>
      <div className="coil-cats">
        {CATS.map((item) => (
          <button key={item} type="button" className={cat === item ? 'is-on' : ''} onClick={() => setCat(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="coil-skin-grid">
        {skins.map((skin) => (
          <button
            key={skin.id}
            type="button"
            className={`coil-skin-card ${equipped === skin.id ? 'is-on' : ''}`}
            disabled={!skin.unlocked}
            onClick={() => skin.unlocked && onEquip(skin.id)}
          >
            <i style={{ background: `linear-gradient(135deg, ${skin.color}, ${skin.accent})`, opacity: skin.unlocked ? 1 : 0.4 }} />
            <strong>{skin.name}</strong>
            <em>{skin.rarity}</em>
            <span>{equipped === skin.id ? 'Equipped' : skin.unlocked ? 'Unlock ready' : skin.unlock}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
