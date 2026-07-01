'use client';

import { Users, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Room } from '@/types';

interface RoomBrowserProps {
  rooms: Room[];
  onJoinRoom: (roomId: string) => void;
  onSpectate: (roomId: string) => void;
}

export function RoomBrowser({ rooms, onJoinRoom, onSpectate }: RoomBrowserProps) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No rooms available. Create one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <Card key={room.id} className="flex items-center gap-4 !p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{room.name}</span>
              {room.isPrivate && <Lock className="w-3 h-3 text-yellow-400" />}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Avatar name={room.hostUsername} size="xs" />
                {room.hostUsername}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {room.players.length}/{room.maxPlayers}
              </span>
            </div>
          </div>
          <Badge variant={room.status === 'waiting' ? 'success' : room.status === 'playing' ? 'warning' : 'default'}>
            {room.status}
          </Badge>
          {room.status === 'waiting' ? (
            <Button size="sm" onClick={() => onJoinRoom(room.id)}>Join</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onSpectate(room.id)}>Watch</Button>
          )}
        </Card>
      ))}
    </div>
  );
}
