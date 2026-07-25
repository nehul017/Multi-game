import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { AppError } from '../utils/AppError';
import { generateToken, generateReferralCode } from '../utils/helpers';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { gameEvents, EVENTS } from '../events';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUserDocument } from '../interfaces/user.interface';
import { economyService } from './economy.service';
import { COIN_REWARDS } from '../utils/constants';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  referralCode?: string;
}

class AuthService {
  async register(data: RegisterData): Promise<{ user: IUserDocument; tokens: AuthTokens }> {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }

    let referrer: IUserDocument | null = null;
    if (data.referralCode) {
      referrer = await userRepository.findOne({
        referralCode: data.referralCode.toUpperCase(),
      });
      if (!referrer) {
        throw new AppError('Invalid referral code', 400);
      }
    }

    const verificationToken = generateToken();
    const referralCode = generateReferralCode(data.username);

    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      password: data.password,
      verificationToken,
      referralCode,
      coins: 0,
      referredBy: referrer?._id,
    } as Partial<IUserDocument>);

    try {
      await sendVerificationEmail(data.email, verificationToken);
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    await economyService.creditCoins(
      user._id.toString(),
      COIN_REWARDS.WELCOME,
      'welcome',
      'Welcome bonus coins',
      {}
    );

    if (referrer) {
      await economyService.processReferralReward(referrer._id.toString(), user._id.toString());
    }

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    const refreshed = await userRepository.findById(user._id.toString());
    gameEvents.emit(EVENTS.USER_REGISTERED, { userId: user._id });

    return { user: refreshed || user, tokens: { accessToken, refreshToken } };
  }

  async login(email: string, password: string, ip?: string, userAgent?: string): Promise<{ user: IUserDocument; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      throw new AppError('Your account has been banned', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    gameEvents.emit(EVENTS.USER_LOGGED_IN, { userId: user._id });

    return { user, tokens: { accessToken, refreshToken } };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    if (!token) {
      throw new AppError('Refresh token required', 400);
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, env.jwtRefreshSecret) as { id: string };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await userRepository.findByRefreshToken(token);
    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = user.generateAuthToken();
    return { accessToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('No account with that email', 404);
    }

    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch {
      user.resetPasswordToken = '';
      user.resetPasswordExpire = undefined as any;
      await user.save();
      throw new AppError('Failed to send reset email. Try again later.', 500);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = '';
    user.resetPasswordExpire = undefined as any;
    user.refreshToken = '';
    await user.save();
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    user.isVerified = true;
    user.verificationToken = '';
    await user.save();
  }

  async logout(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (user) {
      user.refreshToken = '';
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }

    await sessionRepository.deactivateAllForUser(userId);
  }

  async getMe(userId: string): Promise<IUserDocument | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    // Backfill referral code for legacy accounts
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user.username);
      await user.save();
    }

    return user;
  }
}

export const authService = new AuthService();
