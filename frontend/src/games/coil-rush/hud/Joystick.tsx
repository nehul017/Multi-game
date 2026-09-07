'use client';

import { useRef, useState } from 'react';

interface JoystickProps {
  onAngle: (angle: number | null) => void;
}

export function Joystick({ onAngle }: JoystickProps) {
  const root = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const point = (clientX: number, clientY: number) => {
    const el = root.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    const max = rect.width / 2 - 18;
    const dist = Math.hypot(x, y);
    const nx = dist > max ? (x / dist) * max : x;
    const ny = dist > max ? (y / dist) * max : y;
    setKnob({ x: nx, y: ny });
    if (dist < 8) return;
    onAngle(Math.atan2(y, x));
  };

  return (
    <div
      ref={root}
      className="coil-joystick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        point(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons) point(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        setKnob({ x: 0, y: 0 });
        onAngle(null);
      }}
    >
      <span className="coil-joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
