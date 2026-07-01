import { userRepository } from '../repositories/user.repository';
import { friendRepository } from '../repositories/friend.repository';
import { matchRepository } from '../repositories/match.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../utils/AppError';
import { IUserDocument, IUserUpdate } from '../interfaces/user.interface';
import { gameEvents, EVENTS } from '../events';
import bcrypt from 'bcryptjs';

class UserService {
  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId: string, data: IUserUpdate): Promise<IUserDocument> {
    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing._id.toString() !== userId) {
        throw new AppError('Username already taken', 409);
      }
    }

    const user = await userRepository.updateById(userId, data);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findOne({ _id: userId } as any);
    if (!user) throw new AppError('User not found', 404);

    const fullUser = await userRepository.findByEmail(user.email);
    if (!fullUser) throw new AppError('User not found', 404);

    const isMatch = await fullUser.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    fullUser.password = newPassword;
    await fullUser.save();
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    return userRepository.searchUsers(query, page, limit);
  }

  async getFriends(userId: string) {
    const friendships = await friendRepository.getFriends(userId);
    return friendships.map((f) => {
      const friend = f.requester.toString() === userId
        ? (f as any).populated('recipient') ? f.recipient : f.recipient
        : (f as any).populated('requester') ? f.requester : f.requester;
      return friend;
    });
  }

  async sendFriendRequest(userId: string, recipientId: string): Promise<void> {
    if (userId === recipientId) {
      throw new AppError('Cannot send friend request to yourself', 400);
    }

    const recipient = await userRepository.findById(recipientId);
    if (!recipient) throw new AppError('User not found', 404);

    const existing = await friendRepository.findFriendship(userId, recipientId);
    if (existing) {
      if (existing.status === 'accepted') throw new AppError('Already friends', 400);
      if (existing.status === 'pending') throw new AppError('Friend request already pending', 400);
      if (existing.status === 'blocked') throw new AppError('Unable to send friend request', 400);
    }

    await friendRepository.create({
      requester: userId,
      recipient: recipientId,
      status: 'pending',
    } as any);

    await notificationRepository.create({
      user: recipientId,
      type: 'friend_request',
      title: 'Friend Request',
      message: `You have a new friend request`,
      data: { fromUserId: userId },
    } as any);

    gameEvents.emit(EVENTS.FRIEND_REQUEST_SENT, { from: userId, to: recipientId });
  }

  async acceptFriendRequest(userId: string, requestId: string): Promise<void> {
    const request = await friendRepository.findById(requestId);
    if (!request) throw new AppError('Friend request not found', 404);
    if (request.recipient.toString() !== userId) throw new AppError('Not authorized', 403);
    if (request.status !== 'pending') throw new AppError('Request already processed', 400);

    await friendRepository.acceptRequest(requestId);
    await userRepository.addFriend(userId, request.requester.toString());
    await userRepository.addFriend(request.requester.toString(), userId);

    gameEvents.emit(EVENTS.FRIEND_REQUEST_ACCEPTED, {
      user1: userId,
      user2: request.requester.toString(),
    });
  }

  async rejectFriendRequest(userId: string, requestId: string): Promise<void> {
    const request = await friendRepository.findById(requestId);
    if (!request) throw new AppError('Friend request not found', 404);
    if (request.recipient.toString() !== userId) throw new AppError('Not authorized', 403);

    await friendRepository.rejectRequest(requestId);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await friendRepository.findFriendship(userId, friendId);
    if (!friendship || friendship.status !== 'accepted') {
      throw new AppError('Not friends with this user', 400);
    }

    await friendRepository.deleteById(friendship._id.toString());
    await userRepository.removeFriend(userId, friendId);
    await userRepository.removeFriend(friendId, userId);
  }

  async getUserStats(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    return {
      elo: user.elo,
      xp: user.xp,
      level: user.level,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      gamesPlayed: user.gamesPlayed,
      winRate: user.gamesPlayed > 0 ? ((user.wins / user.gamesPlayed) * 100).toFixed(1) : '0.0',
    };
  }

  async getMatchHistory(userId: string, page: number = 1, limit: number = 20) {
    return matchRepository.findByUser(userId, page, limit);
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await userRepository.updateOnlineStatus(userId, isOnline);
    gameEvents.emit(isOnline ? EVENTS.USER_ONLINE : EVENTS.USER_OFFLINE, { userId });
  }

  async getPendingFriendRequests(userId: string) {
    return friendRepository.getPendingRequests(userId);
  }

  async getSentFriendRequests(userId: string) {
    return friendRepository.getSentRequests(userId);
  }
}

export const userService = new UserService();
