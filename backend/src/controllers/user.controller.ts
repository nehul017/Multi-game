import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id || req.user!._id.toString();
      const user = await userService.getProfile(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateProfile(req.user!._id.toString(), req.body);
      res.json({ success: true, data: user, message: 'Profile updated' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user!._id.toString(), currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, page = '1', limit = '20' } = req.query;
      const result = await userService.searchUsers(
        q as string || '',
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const friends = await userService.getFriends(req.user!._id.toString());
      res.json({ success: true, data: friends });
    } catch (error) {
      next(error);
    }
  }

  async sendFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.sendFriendRequest(req.user!._id.toString(), req.params.userId);
      res.json({ success: true, message: 'Friend request sent' });
    } catch (error) {
      next(error);
    }
  }

  async acceptFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.acceptFriendRequest(req.user!._id.toString(), req.params.requestId);
      res.json({ success: true, message: 'Friend request accepted' });
    } catch (error) {
      next(error);
    }
  }

  async rejectFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.rejectFriendRequest(req.user!._id.toString(), req.params.requestId);
      res.json({ success: true, message: 'Friend request rejected' });
    } catch (error) {
      next(error);
    }
  }

  async removeFriend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.removeFriend(req.user!._id.toString(), req.params.friendId);
      res.json({ success: true, message: 'Friend removed' });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id || req.user!._id.toString();
      const stats = await userService.getUserStats(userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getMatchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id || req.user!._id.toString();
      const { page = '1', limit = '20' } = req.query;
      const history = await userService.getMatchHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async getPendingFriendRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await userService.getPendingFriendRequests(req.user!._id.toString());
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  async getSentFriendRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await userService.getSentFriendRequests(req.user!._id.toString());
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
