'use client';

import type { RoomDef, RoomProgress } from '../types';

interface AtlasMapProps {
  atlas: RoomDef[];
  rooms: RoomProgress[];
  currentId?: string | null;
  onSelect: (id: string) => void;
}

export function AtlasMap({ atlas, rooms, currentId, onSelect }: AtlasMapProps) {
  const byId = new Map(rooms.map((room) => [room.id, room.status]));

  return (
    <div className="pw-atlas" aria-label="Puzzle World atlas">
      <svg className="pw-atlas-links" viewBox="0 0 100 100" aria-hidden="true">
        {atlas.flatMap((room) =>
          room.requires.map((fromId) => {
            const from = atlas.find((item) => item.id === fromId);
            if (!from) return null;
            const open = byId.get(room.id) !== 'locked';
            return (
              <line
                key={`${fromId}-${room.id}`}
                x1={from.atlas.x}
                y1={from.atlas.y}
                x2={room.atlas.x}
                y2={room.atlas.y}
                className={`pw-link${open ? ' is-open' : ''}`}
              />
            );
          })
        )}
      </svg>
      {atlas.map((room) => {
        const status = byId.get(room.id) || 'locked';
        return (
          <button
            key={room.id}
            type="button"
            className={`pw-node is-${status} is-${room.mood}${currentId === room.id ? ' is-current' : ''}`}
            style={{ left: `${room.atlas.x}%`, top: `${room.atlas.y}%` }}
            onClick={() => status !== 'locked' && onSelect(room.id)}
            disabled={status === 'locked'}
            aria-label={`${room.name}, ${status}`}
          >
            <span className="pw-node-id">{room.id}</span>
            <span className="pw-node-name">{room.name}</span>
          </button>
        );
      })}
    </div>
  );
}
