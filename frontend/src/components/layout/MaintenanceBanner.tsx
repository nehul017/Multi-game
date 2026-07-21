'use client';

import { AlertTriangle } from 'lucide-react';

interface MaintenanceBannerProps {
  visible: boolean;
}

export function MaintenanceBanner({ visible }: MaintenanceBannerProps) {
  if (!visible) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-200">Maintenance in progress</p>
        <p className="text-xs text-amber-100/80 mt-0.5">
          The platform is currently under maintenance. Some features may be temporarily unavailable.
        </p>
      </div>
    </div>
  );
}
