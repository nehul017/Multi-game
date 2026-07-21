export interface SettingDefinition {
  dbKey: string;
  category: string;
  description: string;
  defaultValue: unknown;
}

export const SETTING_DEFINITIONS: Record<string, SettingDefinition> = {
  maintenanceMode: {
    dbKey: 'maintenance_mode',
    category: 'system',
    description: 'Enable maintenance mode',
    defaultValue: false,
  },
  registrationOpen: {
    dbKey: 'registration_enabled',
    category: 'auth',
    description: 'Allow new registrations',
    defaultValue: true,
  },
  emailVerification: {
    dbKey: 'email_verification',
    category: 'auth',
    description: 'Require email verification',
    defaultValue: true,
  },
  rateLimit: {
    dbKey: 'rate_limit',
    category: 'system',
    description: 'API rate limit per minute',
    defaultValue: 100,
  },
  loginAttempts: {
    dbKey: 'login_attempts',
    category: 'auth',
    description: 'Max login attempts',
    defaultValue: 5,
  },
  lockoutDuration: {
    dbKey: 'lockout_duration',
    category: 'auth',
    description: 'Lockout duration in minutes',
    defaultValue: 15,
  },
  smtpHost: {
    dbKey: 'smtp_host',
    category: 'email',
    description: 'SMTP host',
    defaultValue: '',
  },
  smtpPort: {
    dbKey: 'smtp_port',
    category: 'email',
    description: 'SMTP port',
    defaultValue: 587,
  },
  fromEmail: {
    dbKey: 'from_email',
    category: 'email',
    description: 'From email address',
    defaultValue: '',
  },
};

export const SETTING_API_KEYS = Object.keys(SETTING_DEFINITIONS);
