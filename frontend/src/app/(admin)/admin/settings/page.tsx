'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Mail, Bell, Save, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [emailVerification, setEmailVerification] = useState(true);
  const [rateLimit, setRateLimit] = useState('100');
  const [loginAttempts, setLoginAttempts] = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('15');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [fromEmail, setFromEmail] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const queryClient = useQueryClient();

  const { data: settingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminService.getSettings(),
  });

  const updateSettings = useMutation({
    mutationFn: (settings: Record<string, unknown>) => adminService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast.success('Settings saved successfully!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const broadcastMutation = useMutation({
    mutationFn: (message: string) => adminService.broadcast('Announcement', message),
    onSuccess: () => {
      toast.success('Announcement broadcasted!');
      setAnnouncement('');
    },
    onError: () => toast.error('Failed to broadcast'),
  });

  useEffect(() => {
    const settings = settingsRes?.data;
    if (settings) {
      setMaintenanceMode(!!settings.maintenanceMode);
      setRegistrationOpen(settings.registrationOpen !== false);
      setEmailVerification(settings.emailVerification !== false);
      setRateLimit(String(settings.rateLimit ?? '100'));
      setLoginAttempts(String(settings.loginAttempts ?? '5'));
      setLockoutDuration(String(settings.lockoutDuration ?? '15'));
      setSmtpHost(String(settings.smtpHost ?? ''));
      setSmtpPort(String(settings.smtpPort ?? '587'));
      setFromEmail(String(settings.fromEmail ?? ''));
    }
  }, [settingsRes]);

  const handleSaveGeneral = () => {
    updateSettings.mutate({ maintenanceMode, registrationOpen, emailVerification });
  };

  const handleSaveRateLimits = () => {
    updateSettings.mutate({
      rateLimit: parseInt(rateLimit),
      loginAttempts: parseInt(loginAttempts),
      lockoutDuration: parseInt(lockoutDuration),
    });
  };

  const handleSaveEmail = () => {
    updateSettings.mutate({ smtpHost, smtpPort: parseInt(smtpPort), fromEmail });
  };

  const handleBroadcast = () => {
    if (announcement.trim()) {
      broadcastMutation.mutate(announcement.trim());
    }
  };

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState title="Failed to load settings" message="Could not fetch settings." onRetry={refetch} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary-400" />
            System Settings
          </h1>
          <p className="text-theme-muted mt-1">Configure platform settings</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <h3 className="text-lg font-semibold text-theme-primary mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-400" />
                General Settings
              </h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-theme-primary">Maintenance Mode</p>
                    <p className="text-xs text-theme-muted">Temporarily disable the platform</p>
                  </div>
                  <Switch checked={maintenanceMode} onChange={setMaintenanceMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-theme-primary">Open Registration</p>
                    <p className="text-xs text-theme-muted">Allow new users to register</p>
                  </div>
                  <Switch checked={registrationOpen} onChange={setRegistrationOpen} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-theme-primary">Email Verification</p>
                    <p className="text-xs text-theme-muted">Require email verification</p>
                  </div>
                  <Switch checked={emailVerification} onChange={setEmailVerification} />
                </div>
                <Button
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveGeneral}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <h3 className="text-lg font-semibold text-theme-primary mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary-400" />
                Rate Limiting
              </h3>
              <div className="space-y-4">
                <Input
                  label="API Rate Limit (req/min)"
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                />
                <Input
                  label="Login Attempts"
                  type="number"
                  value={loginAttempts}
                  onChange={(e) => setLoginAttempts(e.target.value)}
                />
                <Input
                  label="Lockout Duration (minutes)"
                  type="number"
                  value={lockoutDuration}
                  onChange={(e) => setLockoutDuration(e.target.value)}
                />
                <Button
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveRateLimits}
                  disabled={updateSettings.isPending}
                >
                  Update Limits
                </Button>
              </div>
            </Card>

            {/* Email Settings */}
            <Card>
              <h3 className="text-lg font-semibold text-theme-primary mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-yellow-400" />
                Email Settings
              </h3>
              <div className="space-y-4">
                <Input
                  label="SMTP Host"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
                <Input
                  label="SMTP Port"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
                <Input
                  label="From Email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
                <Button
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveEmail}
                  disabled={updateSettings.isPending}
                >
                  Save Email Settings
                </Button>
              </div>
            </Card>

            {/* Broadcast */}
            <Card>
              <h3 className="text-lg font-semibold text-theme-primary mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-400" />
                Broadcast Announcement
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1.5">Message</label>
                  <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    rows={4}
                    className="w-full bg-surface border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
                    placeholder="Type announcement to broadcast to all users..."
                  />
                </div>
                <Button
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleBroadcast}
                  disabled={!announcement.trim() || broadcastMutation.isPending}
                >
                  {broadcastMutation.isPending ? 'Broadcasting...' : 'Broadcast'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
