import { create } from 'zustand';
import { Conversation, Message } from '@/types';

interface ChatState {
  conversations: Conversation[];
  activeChat: string | null;
  messages: Record<string, Message[]>;
  unreadCount: number;
  typingUsers: Record<string, string[]>;
}

interface ChatActions {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveChat: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  setUnreadCount: (count: number) => void;
  markRead: (chatId: string) => void;
  setTypingUser: (chatId: string, userId: string, isTyping: boolean) => void;
  updateLastMessage: (chatId: string, message: Message) => void;
}

export const useChatStore = create<ChatState & ChatActions>()((set) => ({
  conversations: [],
  activeChat: null,
  messages: {},
  unreadCount: 0,
  typingUsers: {},

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setActiveChat: (chatId) => set({ activeChat: chatId }),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markRead: (chatId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.conversations.find((c) => c.id === chatId)?.unreadCount || 0)),
    })),

  setTypingUser: (chatId, userId, isTyping) =>
    set((state) => {
      const currentTyping = state.typingUsers[chatId] || [];
      const newTyping = isTyping
        ? [...currentTyping.filter((id) => id !== userId), userId]
        : currentTyping.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [chatId]: newTyping },
      };
    }),

  updateLastMessage: (chatId, message) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === chatId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c
      ),
    })),
}));
