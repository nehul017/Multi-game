'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (data: { name: string; isPrivate: boolean; maxPlayers: number; password?: string }) => void;
  gameSlug: string;
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom, gameSlug }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      name: name || `${gameSlug} Room`,
      isPrivate,
      maxPlayers: parseInt(maxPlayers),
      ...(isPrivate && password ? { password } : {}),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Room Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter room name"
        />

        <Select
          label="Max Players"
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
          options={[
            { value: '2', label: '2 Players' },
            { value: '4', label: '4 Players' },
          ]}
        />

        <Switch
          checked={isPrivate}
          onChange={setIsPrivate}
          label="Private Room"
        />

        {isPrivate && (
          <Input
            label="Room Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password"
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
