import { Document, Types } from 'mongoose';

export type TransactionType =
  | 'match_win'
  | 'match_loss'
  | 'match_draw'
  | 'daily_login'
  | 'mission'
  | 'achievement'
  | 'referral'
  | 'pack_purchase'
  | 'store_purchase'
  | 'admin_grant'
  | 'admin_deduct'
  | 'refund'
  | 'welcome'
  | 'slot_bet'
  | 'slot_win'
  | 'poker_buyin'
  | 'poker_win'
  | 'poker_refund';

export interface ITransaction {
  _id: string;
  userId: Types.ObjectId | string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionDocument extends Omit<ITransaction, '_id'>, Document {}

export type StoreItemType = 'avatar' | 'theme' | 'frame' | 'badge' | 'premium' | 'consumable';
export type StoreItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface IStoreItem {
  _id: string;
  name: string;
  description: string;
  type: StoreItemType;
  rarity: StoreItemRarity;
  price: number;
  image: string;
  preview?: string;
  isActive: boolean;
  isPremium: boolean;
  stock: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreItemDocument extends Omit<IStoreItem, '_id'>, Document {}

export interface IInventoryItem {
  itemId: string;
  purchasedAt: Date;
  equipped: boolean;
}

export type MissionType = 'daily' | 'weekly';
export type MissionConditionType =
  | 'wins'
  | 'games_played'
  | 'login'
  | 'friends_added'
  | 'spend_coins'
  | 'earn_coins';

export interface IMission {
  _id: string;
  title: string;
  description: string;
  type: MissionType;
  condition: {
    type: MissionConditionType;
    value: number;
    gameType?: string;
  };
  coinReward: number;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMissionDocument extends Omit<IMission, '_id'>, Document {}

export interface IUserMissionProgress {
  _id: string;
  userId: Types.ObjectId | string;
  missionId: Types.ObjectId | string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  periodKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMissionProgressDocument extends Omit<IUserMissionProgress, '_id'>, Document {}

export interface ICoinPack {
  _id: string;
  name: string;
  description: string;
  coins: number;
  bonusCoins: number;
  priceLabel: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoinPackDocument extends Omit<ICoinPack, '_id'>, Document {}
