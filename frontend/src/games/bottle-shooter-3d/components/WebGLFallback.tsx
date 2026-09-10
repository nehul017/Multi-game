'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function WebGLFallback() {
  return (
    <div className="bs-overlay">
      <section className="bs-card">
        <p className="bs-kicker">Unavailable</p>
        <h2>3D range unavailable</h2>
        <p className="bs-copy">This device cannot start WebGL. Try another browser or enable hardware acceleration.</p>
        <Link href="/games" className="bs-cta">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Games
        </Link>
      </section>
    </div>
  );
}
