'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CARROM_BRAND } from './brand';

export function CarromHub() {
  return (
    <AuthGuard>
      <div className="carrom-root">
        <div className="carrom-plant" aria-hidden />
        <div className="carrom-book" aria-hidden />
        <div className="carrom-hub">
          <div className="carrom-hub-card">
            <Link href="/games" className="carrom-pill" style={{ marginBottom: 18 }}>
              <ArrowLeft className="w-4 h-4" />
              Games
            </Link>
            <p className="carrom-brand-title">{CARROM_BRAND.title}</p>
            <p className="carrom-brand-sub">{CARROM_BRAND.subtitle}</p>
            <p style={{ marginTop: 16, color: 'rgba(246,239,228,0.7)', lineHeight: 1.6 }}>
              Drag to aim, release to strike, cover the queen, and play first to 5 points.
            </p>
            <div className="carrom-hub-actions">
              <Link href="/games/carrom/play?mode=match">Find match</Link>
              <Link href="/games/carrom/play?mode=bots">Play vs Bot</Link>
              <Link href="/games" className="is-ghost">
                Back to library
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

