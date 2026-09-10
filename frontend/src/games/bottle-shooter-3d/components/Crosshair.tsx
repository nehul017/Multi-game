'use client';

interface CrosshairProps {
  targeted: boolean;
  firing: boolean;
  hit?: boolean;
  perfect?: boolean;
}

export function Crosshair({ targeted, firing, hit, perfect }: CrosshairProps) {
  return (
    <div
      className={`bs-crosshair${targeted ? ' is-hot' : ''}${firing ? ' is-fire' : ''}${hit ? ' is-hit' : ''}${perfect ? ' is-perfect' : ''}`}
      aria-hidden="true"
    >
      <i className="bs-ch-t" />
      <i className="bs-ch-b" />
      <i className="bs-ch-l" />
      <i className="bs-ch-r" />
      <i className="bs-ch-dot" />
      {targeted && <i className="bs-ch-ring" />}
      {perfect && <i className="bs-ch-perfect" />}
    </div>
  );
}
