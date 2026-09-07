'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGameRooms } from '@/hooks';
import { gameService } from '@/services/game.service';
import { CHESS_BRAND } from '../brand';
import { chessAudio } from '../audio/chessAudio';

interface RoomsScreenProps {
  onBack: () => void;
  onCreate: (roomId?: string) => void;
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
  const { data } = useGameRooms(CHESS_BRAND.slug);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const payload = data?.data as unknown;
  const rooms: RoomRow[] = (Array.isArray(payload) ? payload : (payload as { data?: RoomRow[] })?.data ?? []) as RoomRow[];

  return (
    <section className="cx-screen">
      <button type="button" className="cx-back" onClick={onBack}>Back</button>
      <h2>Private game</h2>
      <p className="text-theme-muted mb-5">Open a room or join with a code.</p>
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <Button
          variant="primary"
          isLoading={creating}
          onClick={async () => {
            chessAudio.play('click');
            setCreating(true);
            try {
              const res = await gameService.createMatch(CHESS_BRAND.slug, { private: true, name: 'Chess room' });
              const room = res?.data as { roomId?: string; id?: string } | undefined;
              onCreate(room?.roomId || room?.id);
            } finally {
              setCreating(false);
            }
          }}
        >
          Create room
        </Button>
        <div className="flex gap-2 flex-1">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Room code" />
          <Button
            variant="secondary"
            disabled={!code.trim()}
            onClick={() => {
              chessAudio.play('click');
              onCreate(code.trim());
            }}
          >
            Join
          </Button>
        </div>
      </div>
      <ol className="cx-room-list">
        {rooms.map((room) => {
          const id = String(room.roomId || room.id || room._id || '');
          const count = room.players?.length || 0;
          return (
            <li key={id}>
              <span>{room.name || 'Chess room'}</span>
              <em>{count}/{room.maxPlayers || 2}</em>
              {id && (
                <Link className="cx-chip-btn" href={`/games/${CHESS_BRAND.slug}/play?mode=private&room=${id}`}>
                  Join
                </Link>
              )}
            </li>
          );
        })}
        {rooms.length === 0 && <p className="text-theme-muted">No open rooms yet.</p>}
      </ol>
    </section>
  );
}
