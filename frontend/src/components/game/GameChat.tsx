'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { cn } from '@/lib/utils';

export interface GameChatMessage {
  id?: string;
  userId?: string;
  user: string;
  text: string;
  timestamp?: string | number;
}

interface GameChatProps {
  messages: GameChatMessage[];
  onSendMessage: (content: string) => void;
  currentUserId?: string;
  currentUsername?: string;
  className?: string;
  compact?: boolean;
}

function formatTime(ts?: string | number) {
  if (!ts) return '';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function GameChat({
  messages,
  onSendMessage,
  currentUserId,
  currentUsername,
  className,
  compact,
}: GameChatProps) {
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const prevLen = useRef(messages.length);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messages.length > prevLen.current && !focused) {
      const last = messages[messages.length - 1];
      const mine =
        (currentUsername && last?.user === currentUsername) ||
        (currentUserId && last?.userId === currentUserId);
      if (!mine) setUnread((u) => u + 1);
    }
    prevLen.current = messages.length;
  }, [messages, focused, currentUserId, currentUsername]);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    onSendMessage(value);
    setInput('');
    setUnread(0);
  };

  return (
    <div
      className={cn(
        'ludo-glass flex flex-col rounded-2xl border border-theme overflow-hidden',
        compact ? 'h-64' : 'h-72',
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-theme bg-primary-500/[0.04]">
        <MessageSquare className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-semibold text-theme-primary tracking-tight flex-1">Game Chat</span>
        {unread > 0 && (
          <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2.5 px-3 py-3 min-h-0"
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setUnread(0);
        }}
      >
        {messages.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-8">No messages yet — say gl hf!</p>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const mine =
                (currentUsername && msg.user === currentUsername) ||
                (currentUserId && msg.userId === currentUserId);
              return (
                <motion.div
                  key={msg.id || `${msg.user}-${i}-${msg.text}`}
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn('flex gap-2', mine && 'flex-row-reverse')}
                >
                  <Avatar name={msg.user} size="xs" />
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3 py-2 border',
                      mine
                        ? 'bg-primary-500/15 border-primary-500/25 rounded-tr-md'
                        : 'bg-theme-secondary/80 border-theme rounded-tl-md'
                    )}
                  >
                    <div className={cn('flex items-center gap-2 mb-0.5', mine && 'flex-row-reverse')}>
                      <p className="text-[10px] font-semibold text-primary-500">{msg.user}</p>
                      {msg.timestamp && (
                        <span className="text-[9px] text-theme-muted">{formatTime(msg.timestamp)}</span>
                      )}
                    </div>
                    <p className="text-xs text-theme-primary whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="p-3 border-t border-theme bg-[var(--glass-bg)] space-y-2">
        {input.trim() && (
          <div className="flex items-center gap-1.5 px-1" aria-live="polite">
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-primary-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 rounded-full bg-primary-400 animate-bounce [animation-delay:120ms]" />
              <span className="w-1 h-1 rounded-full bg-primary-400 animate-bounce [animation-delay:240ms]" />
            </span>
            <span className="text-[10px] text-theme-muted">Typing…</span>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <EmojiPicker onSelect={(emoji) => setInput((v) => `${v}${emoji}`)} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onFocus={() => {
              setFocused(true);
              setUnread(0);
            }}
            onBlur={() => setFocused(false)}
            placeholder="Type a message…"
            aria-label="Game chat message"
            className="input-glass flex-1 px-3 py-2.5 text-xs rounded-xl"
          />
          <Button
            size="sm"
            onClick={handleSend}
            aria-label="Send message"
            disabled={!input.trim()}
            className="rounded-xl"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
