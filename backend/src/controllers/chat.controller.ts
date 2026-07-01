import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';

class ChatController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = await chatService.sendMessage(req.user!._id.toString(), req.body);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '50' } = req.query;
      const messages = await chatService.getMessages(
        req.user!._id.toString(),
        req.params.userId,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async getRoomMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '50' } = req.query;
      const messages = await chatService.getRoomMessages(
        req.params.roomId,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await chatService.getConversations(req.user!._id.toString());
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await chatService.markAsRead(req.user!._id.toString(), req.params.senderId);
      res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await chatService.getUnreadCount(req.user!._id.toString());
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await chatService.deleteMessage(req.params.id, req.user!._id.toString());
      res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
