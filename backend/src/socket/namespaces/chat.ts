import { Server, Socket } from 'socket.io';
import { chatService } from '../../services/chat.service';
import { SOCKET_EVENTS } from '../../utils/constants';

export const setupChatNamespace = (io: Server): void => {
  const chatNs = io.of('/chat');

  chatNs.on('connection', (socket: Socket) => {
    console.log(`Chat: ${socket.user?.username} connected`);

    socket.on(SOCKET_EVENTS.CHAT.JOIN_ROOM, (roomId: string) => {
      socket.join(roomId);
      console.log(`${socket.user?.username} joined chat room ${roomId}`);
    });

    socket.on(SOCKET_EVENTS.CHAT.LEAVE_ROOM, (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: {
      receiver?: string;
      room?: string;
      content: string;
      type?: 'text' | 'emoji' | 'system';
    }) => {
      try {
        if (!socket.user) return;

        const message = await chatService.sendMessage(socket.user._id.toString(), data);

        const populated = await message.populate('sender', 'username avatar');
        const payload = populated.toObject ? populated.toObject() : populated;

        if (data.room) {
          // Ensure sender is in the room so they (and any late joiners) receive broadcasts
          socket.join(data.room);
          chatNs.to(data.room).emit(SOCKET_EVENTS.CHAT.NEW_MESSAGE, payload);
        } else if (data.receiver) {
          socket.emit(SOCKET_EVENTS.CHAT.NEW_MESSAGE, payload);
          chatNs.to(`user:${data.receiver}`).emit(SOCKET_EVENTS.CHAT.NEW_MESSAGE, payload);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on(SOCKET_EVENTS.CHAT.TYPING, (data: { room?: string; to?: string }) => {
      const typingData = { userId: socket.user?._id, username: socket.user?.username };

      if (data.room) {
        socket.to(data.room).emit(SOCKET_EVENTS.CHAT.USER_TYPING, typingData);
      } else if (data.to) {
        chatNs.to(`user:${data.to}`).emit(SOCKET_EVENTS.CHAT.USER_TYPING, typingData);
      }
    });

    socket.on(SOCKET_EVENTS.CHAT.STOP_TYPING, (data: { room?: string; to?: string }) => {
      const typingData = { userId: socket.user?._id, username: socket.user?.username };

      if (data.room) {
        socket.to(data.room).emit(SOCKET_EVENTS.CHAT.USER_STOP_TYPING, typingData);
      } else if (data.to) {
        chatNs.to(`user:${data.to}`).emit(SOCKET_EVENTS.CHAT.USER_STOP_TYPING, typingData);
      }
    });

    socket.on(SOCKET_EVENTS.CHAT.MARK_READ, async (data: { senderId: string }) => {
      try {
        if (!socket.user) return;
        await chatService.markAsRead(socket.user._id.toString(), data.senderId);
        chatNs
          .to(`user:${data.senderId}`)
          .emit(SOCKET_EVENTS.CHAT.MESSAGE_READ, { readBy: socket.user._id });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });

    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
    }

    socket.on('disconnect', () => {
      console.log(`Chat: ${socket.user?.username} disconnected`);
    });
  });
};
