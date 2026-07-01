import { BaseRepository } from './base.repository';
import { Friend } from '../models/friend.model';
import { IFriendDocument } from '../interfaces/friend.interface';

class FriendRepository extends BaseRepository<IFriendDocument> {
  constructor() {
    super(Friend);
  }

  async findFriendship(user1: string, user2: string): Promise<IFriendDocument | null> {
    return this.model
      .findOne({
        $or: [
          { requester: user1, recipient: user2 },
          { requester: user2, recipient: user1 },
        ],
      })
      .exec();
  }

  async getFriends(userId: string): Promise<IFriendDocument[]> {
    return this.model
      .find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted',
      })
      .populate('requester recipient', 'username avatar isOnline elo level')
      .exec();
  }

  async getPendingRequests(userId: string): Promise<IFriendDocument[]> {
    return this.model
      .find({ recipient: userId, status: 'pending' })
      .populate('requester', 'username avatar elo level')
      .exec();
  }

  async getSentRequests(userId: string): Promise<IFriendDocument[]> {
    return this.model
      .find({ requester: userId, status: 'pending' })
      .populate('recipient', 'username avatar elo level')
      .exec();
  }

  async acceptRequest(requestId: string): Promise<IFriendDocument | null> {
    return this.model.findByIdAndUpdate(requestId, { status: 'accepted' }, { new: true }).exec();
  }

  async rejectRequest(requestId: string): Promise<IFriendDocument | null> {
    return this.model.findByIdAndUpdate(requestId, { status: 'rejected' }, { new: true }).exec();
  }

  async blockUser(userId: string, blockId: string): Promise<IFriendDocument> {
    const existing = await this.findFriendship(userId, blockId);
    if (existing) {
      existing.status = 'blocked';
      return existing.save();
    }
    return this.model.create({ requester: userId, recipient: blockId, status: 'blocked' });
  }

  async areFriends(user1: string, user2: string): Promise<boolean> {
    const friendship = await this.model.findOne({
      $or: [
        { requester: user1, recipient: user2 },
        { requester: user2, recipient: user1 },
      ],
      status: 'accepted',
    });
    return !!friendship;
  }
}

export const friendRepository = new FriendRepository();
