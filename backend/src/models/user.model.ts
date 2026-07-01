import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserDocument } from '../interfaces/user.interface';
import { env } from '../config/env';

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: [500, 'Bio cannot exceed 500 characters'] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    elo: { type: Number, default: 1000 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [
      {
        from: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      },
    ],
    achievements: [{ type: Schema.Types.ObjectId, ref: 'Achievement' }],
    lastSeen: { type: Date, default: Date.now },
    refreshToken: { type: String, select: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ elo: -1 });
userSchema.index({ level: -1 });
userSchema.index({ isOnline: 1 });

userSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function (): string {
  return jwt.sign({ id: this._id, role: this.role }, env.jwtSecret, {
    expiresIn: env.jwtExpire as string,
  } as jwt.SignOptions);
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpire as string,
  } as jwt.SignOptions);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
