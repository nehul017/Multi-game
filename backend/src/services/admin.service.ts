import { userRepository } from '../repositories/user.repository';
import { matchRepository } from '../repositories/match.repository';
import { reportRepository } from '../repositories/report.repository';
import { settingsRepository } from '../repositories/settings.repository';
import { SETTING_DEFINITIONS } from '../utils/settings.constants';
import { sessionRepository } from '../repositories/session.repository';
import { notificationService } from './notification.service';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';
import os from 'os';

class AdminService {
  async getDashboardStats() {
    const [totalUsers, onlineUsers, totalMatches, activeMatches, pendingReports] = await Promise.all([
      userRepository.count(),
      userRepository.count({ isOnline: true } as any),
      matchRepository.count(),
      matchRepository.count({ status: { $in: ['waiting', 'playing'] } } as any),
      reportRepository.count({ status: 'pending' } as any),
    ]);

    return {
      totalUsers,
      onlineUsers,
      totalMatches,
      activeMatches,
      pendingReports,
    };
  }

  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    if (search) {
      return userRepository.searchUsers(search, page, limit);
    }
    return userRepository.findMany({}, { page, limit, sort: '-createdAt' });
  }

  async banUser(userId: string, adminId: string, reason: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot ban an admin', 400);

    await userRepository.updateById(userId, { isBanned: true } as any);

    await notificationService.create(
      userId,
      'system',
      'Account Banned',
      `Your account has been banned. Reason: ${reason}`,
      { bannedBy: adminId, reason }
    );
  }

  async unbanUser(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    await userRepository.updateById(userId, { isBanned: false } as any);

    await notificationService.create(
      userId,
      'system',
      'Account Unbanned',
      'Your account has been unbanned.',
      {}
    );
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot delete an admin', 400);
    await userRepository.deleteById(userId);
  }

  async getActiveGames() {
    return matchRepository.getActiveMatches();
  }

  async getReports(page: number = 1, limit: number = 20, status?: string) {
    if (status === 'pending') {
      return reportRepository.findPending(page, limit);
    }
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return reportRepository.findMany(filter, {
      page,
      limit,
      sort: '-createdAt',
      populate: 'reporter reported resolvedBy',
    });
  }

  async resolveReport(
    reportId: string,
    adminId: string,
    resolution: string,
    action: 'resolved' | 'dismissed'
  ) {
    const report = await reportRepository.resolve(reportId, adminId, resolution, action);
    if (!report) throw new AppError('Report not found', 404);
    return report;
  }

  async broadcastAnnouncement(title: string, message: string, adminId: string): Promise<void> {
    const users = await userRepository.findMany({}, { limit: 10000 });

    const notifications = users.data.map((user) =>
      notificationService.create(
        user._id.toString(),
        'system',
        title,
        message,
        { from: adminId }
      )
    );

    await Promise.allSettled(notifications);
  }

  async getServerHealth() {
    const dbState = mongoose.connection.readyState;
    const dbStates: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date(),
      database: {
        status: dbStates[dbState] || 'unknown',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        memoryUsage: {
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        },
      },
    };
  }

  async getSettings(): Promise<Record<string, unknown>> {
    const records = await settingsRepository.getAll();
    const byDbKey = Object.fromEntries(records.map((record) => [record.key, record.value]));

    const settings: Record<string, unknown> = {};
    for (const [apiKey, definition] of Object.entries(SETTING_DEFINITIONS)) {
      settings[apiKey] = byDbKey[definition.dbKey] ?? definition.defaultValue;
    }

    return settings;
  }

  async updateSettings(updates: Record<string, unknown>): Promise<Record<string, unknown>> {
    const previousMaintenance = await settingsRepository.getByKey('maintenance_mode');
    const wasMaintenanceEnabled = previousMaintenance?.value === true;

    const entries = Object.entries(updates).filter(([apiKey]) => SETTING_DEFINITIONS[apiKey]);

    if (entries.length === 0) {
      throw new AppError('No valid settings provided', 400);
    }

    await Promise.all(
      entries.map(([apiKey, value]) => {
        const definition = SETTING_DEFINITIONS[apiKey];
        return settingsRepository.upsert(
          definition.dbKey,
          value,
          definition.category,
          definition.description
        );
      })
    );

    if (updates.maintenanceMode === true && !wasMaintenanceEnabled) {
      await this.notifyMaintenancePeriod(true);
    } else if (updates.maintenanceMode === false && wasMaintenanceEnabled) {
      await this.notifyMaintenancePeriod(false);
    }

    return this.getSettings();
  }

  private async notifyMaintenancePeriod(enabled: boolean): Promise<void> {
    const users = await userRepository.findMany({}, { limit: 10000 });

    await Promise.allSettled(
      users.data.map((user) =>
        notificationService.create(
          user._id.toString(),
          'system',
          enabled ? 'Maintenance Mode Active' : 'Maintenance Complete',
          enabled
            ? 'The platform is currently under maintenance. Some features may be temporarily unavailable.'
            : 'Maintenance has ended. All platform features are available again.',
          { maintenanceMode: enabled }
        )
      )
    );
  }
}

export const adminService = new AdminService();
