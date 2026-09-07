'use client';

import Link from 'next/link';
import { COIL_BRAND } from '../brand';
import { useGameRooms } from '@/hooks';

interface RoomsScreenProps {
  onBack: () => void;
  onCreate: () => void;
}

interface RoomRow {
  _id?: string;
  id?: string;
  roomId?: string;
  name?: string;
  status?: string;
  maxPlayers?: number;
  players?: unknown[];
}

export function RoomsScreen({ onBack, onCreate }: RoomsScreenProps) {
  const { data } = useGameRooms(COIL_BRAND.slug);
  const payload = data?.data as unknown;
  const rooms: RoomRow[] = (Array.isArray(payload) ? payload : (payload as { data?: RoomRow[] })?.data ?? []) as RoomRow[];

  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Play with friends</h2>
      <p className="coil-empty">Open a private current or join a live arena. No bots in this mode.</p>
      <button type="button" className="coil-cta" onClick={onCreate}>Start private current</button>
      <ol className="coil-rank-list" style={{ marginTop: 16 }}>
        {rooms.map((room) => {
          const id = String(room.roomId || room.id || room._id || '');
          const count = room.players?.length || 0;
          const max = room.maxPlayers || 8;
          const live = room.status === 'playing';
          return (
            <li key={id}>
              <span>{room.name || 'Coil room'}</span>
              <em>{count}/{max} {live ? 'live' : 'open'}</em>
              {id && (
                <Link className="coil-ghost" href={`/games/${COIL_BRAND.slug}/play?mode=friends&room=${id}`}>
                  {live ? 'Join live' : 'Join'}
                </Link>
              )}
            </li>
          );
        })}
        {rooms.length === 0 && <p className="coil-empty">No open rooms yet. Start one and invite a friend.</p>}
      </ol>
    </section>
  );
}
