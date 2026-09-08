'use client';

function hueFromName(name: string): number {
  let hue = 0;
  for (let index = 0; index < name.length; index += 1) {
    hue = (hue + name.charCodeAt(index) * 17) % 360;
  }
  return hue;
}

export function PlayerAvatar({ name, src, bot }: { name: string; src?: string; bot?: boolean }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = hueFromName(name);

  return (
    <span
      className={`pk-avatar ${bot ? 'is-bot' : ''}`}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 42% 38%), hsl(${hue} 48% 18%))` }}
    >
      {src ? <img src={src} alt="" /> : <span>{initials}</span>}
    </span>
  );
}
