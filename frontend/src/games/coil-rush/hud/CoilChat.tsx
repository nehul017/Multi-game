'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useChatSocket } from '@/socket/hooks';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';

interface CoilChatProps {
  roomId?: string;
  open: boolean;
  onClose: () => void;
}

export function CoilChat({ roomId, open, onClose }: CoilChatProps) {
  const { sendMessage, joinChatRoom, leaveChatRoom } = useChatSocket();
  const { user } = useAuthStore();
  const messages = useChatStore((s) => (roomId ? s.messages[roomId] : undefined)) || [];
  const [text, setText] = useState('');

  useEffect(() => {
    if (!roomId || !open) return;
    joinChatRoom(roomId);
    return () => {
      leaveChatRoom(roomId);
    };
  }, [roomId, open, joinChatRoom, leaveChatRoom]);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomId || !text.trim()) return;
    sendMessage(roomId, text.trim());
    setText('');
  };

  return (
    <aside className="coil-chat">
      <header>
        <strong>Arena chat</strong>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <ol>
        {messages.slice(-24).map((msg) => (
          <li key={msg.id || `${msg.createdAt}-${msg.content}`}>
            <b>{msg.senderId === user?.id ? 'You' : msg.senderUsername || 'Rider'}</b>
            <span>{msg.content}</span>
          </li>
        ))}
        {messages.length === 0 && <p className="coil-empty">Say hello to the arena.</p>}
      </ol>
      <form onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" maxLength={180} />
      </form>
    </aside>
  );
}
