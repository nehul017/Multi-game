import { Document } from 'mongoose';

export interface IFriendRequest {
  from: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface IInventoryEntry {
  itemId: string;
  purchasedAt: Date;
  equipped: boolean;
}

export interface IEquippedItems {
  avatar?: string;
  theme?: string;
  frame?: string;
  badge?: string;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isOnline: boolean;
  isBanned: boolean;
  elo: number;
  xp: number;
  level: number;
  coins: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winStreak: number;
  bestWinStreak: number;
  friends: string[];
  friendRequests: IFriendRequest[];
  achievements: string[];
  inventory: IInventoryEntry[];
  equipped: IEquippedItems;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  loginStreak: number;
  lastLoginRewardAt?: Date;
  lastSeen: Date;
  refreshToken: string;
  verificationToken: string;
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
}

export interface IUserCreate {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface IUserUpdate {
  username?: string;
  avatar?: string;
  bio?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}
