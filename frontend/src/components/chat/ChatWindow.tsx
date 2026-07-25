'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onTyping: () => void;
  typingUsers: string[];
  className?: string;
}

export function ChatWindow({ messages, currentUserId, onSendMessage, onTyping, typingUsers, className }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={message.senderId === currentUserId}
          />
        ))}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-surface-lighter/30">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface-light transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-surface-light border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
