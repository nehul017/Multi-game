'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Conversation } from '@/types';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <div className="overflow-y-auto">
      {conversations.map((conv) => {
        const otherParticipant = conv.participants[0];
        const displayName = conv.name || otherParticipant?.username || 'Unknown';

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full flex items-center gap-3 p-3 hover:bg-surface-light/50 transition-colors border-b border-surface-lighter/20',
              activeId === conv.id && 'bg-surface-light/70 border-l-2 border-l-primary-500'
            )}
          >
            <Avatar
              name={displayName}
              src={otherParticipant?.avatar}
              size="md"
              online={otherParticipant?.status === 'online'}
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate">{displayName}</span>
                {conv.lastMessage && (
                  <span className="text-[10px] text-gray-500">
                    {formatRelativeTime(conv.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <p className="text-xs text-gray-400 truncate">
                  {truncate(conv.lastMessage.content, 40)}
                </p>
              )}
            </div>
            {conv.unreadCount > 0 && (
              <span className="w-5 h-5 bg-primary-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
