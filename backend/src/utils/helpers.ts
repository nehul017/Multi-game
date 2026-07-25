import crypto from 'crypto';

export const generateToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const generateReferralCode = (username: string): string => {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const prefix = username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'USER';
  return `${prefix}${suffix}`;
};

export const paginate = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

export const buildSortQuery = (sort: string): Record<string, 1 | -1> => {
  const sortObj: Record<string, 1 | -1> = {};
  const fields = sort.split(',');
  for (const field of fields) {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  }
  return sortObj;
};

export const buildFilterQuery = (query: Record<string, unknown>): Record<string, unknown> => {
  const excluded = ['page', 'limit', 'sort', 'fields', 'search'];
  const filter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (!excluded.includes(key) && value !== undefined && value !== '') {
      filter[key] = value;
    }
  }
  return filter;
};

export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const xpForLevel = (level: number): number => {
  return Math.pow(level - 1, 2) * 100;
};

export const getRankTier = (elo: number): string => {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2200) return 'Master';
  if (elo >= 2000) return 'Diamond';
  if (elo >= 1800) return 'Platinum';
  if (elo >= 1600) return 'Gold';
  if (elo >= 1400) return 'Silver';
  return 'Bronze';
};

export const getDateRange = (days: number): { since: Date; dates: string[] } => {
  const dates: string[] = [];
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  return { since, dates };
};

export const fillDailyCounts = (
  raw: { _id: string; count: number }[],
  days: number
): { date: string; count: number }[] => {
  const { dates } = getDateRange(days);
  const map = new Map(raw.map((entry) => [entry._id, entry.count]));
  return dates.map((date) => ({ date, count: map.get(date) ?? 0 }));
};
