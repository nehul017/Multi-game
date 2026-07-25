'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Message } from '@/types';
import { cn, formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={cn('flex gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {!isMine && (
        <Avatar name={message.senderUsername} src={message.senderAvatar} size="sm" />
      )}
      <div className={cn('max-w-[70%]', isMine && 'items-end')}>
        {!isMine && (
          <p className="text-xs font-medium text-theme-muted mb-1 ml-1">{message.senderUsername}</p>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isMine
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-theme-secondary text-theme-primary border border-theme rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className={cn('text-[10px] text-theme-muted mt-1', isMine ? 'text-right mr-1' : 'ml-1')}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
