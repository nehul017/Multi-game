'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, Smile, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConversations, useMessages } from '@/hooks';
import { useChatSocket } from '@/socket/hooks';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ConversationItem {
  _id?: string;
  id?: string;
  name?: string;
  participants?: Array<{ userId?: string; _id?: string; username: string; avatar?: string; status?: string }>;
  lastMessage?: { content: string; createdAt: string };
  unreadCount?: number;
  updatedAt?: string;
}

interface MessageItem {
  _id?: string;
  id?: string;
  senderId: string;
  senderUsername?: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();
  const { sendMessage, startTyping, stopTyping, joinChatRoom } = useChatSocket();

  const { data: convoData, isLoading: convosLoading } = useConversations();
  const { data: msgData, isLoading: msgsLoading } = useMessages(activeChat || '', 1);

  const convoPayload = convoData?.data as unknown;
  const conversations: ConversationItem[] = (Array.isArray(convoPayload) ? convoPayload : (convoPayload as Record<string, unknown>)?.data ?? []) as ConversationItem[];
  const msgPayload = msgData?.data as unknown;
  const messages: MessageItem[] = (Array.isArray(msgPayload) ? msgPayload : (msgPayload as Record<string, unknown>)?.data ?? []) as MessageItem[];

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = c.name || c.participants?.find((p) => (p.userId || p._id) !== user?.id)?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeConvo = conversations.find((c) => (c._id || c.id) === activeChat);
  const otherParticipant = activeConvo?.participants?.find((p) => (p.userId || p._id) !== user?.id);
  const chatName = activeConvo?.name || otherParticipant?.username || 'Chat';
  const isOnline = otherParticipant?.status === 'online';

  const currentTypingUsers = activeChat ? (typingUsers[activeChat] || []) : [];
  const isTyping = currentTypingUsers.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeChat) joinChatRoom(activeChat);
  }, [activeChat, joinChatRoom]);

  const handleSelectChat = (convId: string) => {
    setActiveChat(convId);
  };

  let typingTimeout: NodeJS.Timeout;
  const handleTyping = () => {
    if (!activeChat) return;
    startTyping(activeChat);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (activeChat) stopTyping(activeChat);
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim() || !activeChat) return;
    sendMessage(activeChat, message.trim());
    setMessage('');
    if (activeChat) stopTyping(activeChat);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full gap-4">
          {/* Conversations List */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-4 border-b border-surface-lighter/30">
              <h2 className="text-lg font-semibold text-white mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-surface-light border border-surface-lighter rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convosLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
              {!convosLoading && filteredConversations.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No conversations</div>
              )}
              {!convosLoading && filteredConversations.map((conv) => {
                const convId = conv._id || conv.id || '';
                const other = conv.participants?.find((p) => (p.userId || p._id) !== user?.id);
                const name = conv.name || other?.username || 'Chat';
                const lastMsg = conv.lastMessage?.content || '';
                const time = conv.lastMessage?.createdAt || conv.updatedAt;
                const unread = conv.unreadCount || 0;
                return (
                  <button
                    key={convId}
                    onClick={() => handleSelectChat(convId)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 hover:bg-surface-light/50 transition-colors',
                      activeChat === convId && 'bg-surface-light/70 border-l-2 border-primary-500'
                    )}
                  >
                    <Avatar name={name} size="md" online={other?.status === 'online'} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate">{name}</span>
                        {time && <span className="text-xs text-gray-500">{formatRelativeTime(time)}</span>}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{lastMsg}</p>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-primary-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="flex flex-col overflow-hidden">
            {!activeChat ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8 text-gray-500" />}
                  title="Select a conversation"
                  description="Choose a conversation from the list to start chatting"
                />
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-surface-lighter/30">
                  <Avatar name={chatName} size="sm" online={isOnline} />
                  <div>
                    <p className="text-sm font-semibold text-white">{chatName}</p>
                    <p className="text-xs text-green-400">
                      {isTyping ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {msgsLoading && Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                      <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-40')} />
                    </div>
                  ))}
                  {!msgsLoading && messages.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">No messages yet. Say hello!</div>
                  )}
                  {!msgsLoading && messages.map((msg) => {
                    const msgId = msg._id || msg.id || '';
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div key={msgId} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2.5',
                          isMine
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-surface-light text-gray-200 rounded-bl-md'
                        )}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn('text-[10px] mt-1', isMine ? 'text-primary-200' : 'text-gray-500')}>
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-surface-lighter/30">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 bg-surface-light border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleSend}
                      className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
