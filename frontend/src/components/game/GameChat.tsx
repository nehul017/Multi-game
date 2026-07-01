'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
}

interface GameChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
  className?: string;
}

export function GameChat({ messages, onSendMessage, currentUserId, className }: GameChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2', msg.userId === currentUserId && 'flex-row-reverse')}>
              <Avatar name={msg.username} size="xs" />
              <div className={cn(
                'max-w-[80%] rounded-lg px-2.5 py-1.5',
                msg.userId === currentUserId ? 'bg-primary-600/30' : 'bg-surface-light'
              )}>
                <p className="text-[10px] font-medium text-primary-300 mb-0.5">{msg.username}</p>
                <p className="text-xs text-gray-200">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Chat..."
          className="flex-1 bg-surface-light border border-surface-lighter rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          onClick={handleSend}
          className="p-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
