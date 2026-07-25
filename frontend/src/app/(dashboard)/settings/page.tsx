'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Volume2, Save, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { useUpdateProfile } from '@/hooks';
import { userService } from '@/services/user.service';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const [activeTab, setActiveTab] = useState('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState({
    friendRequests: true,
    gameInvites: true,
    tournamentUpdates: true,
    messages: true,
    achievements: true,
    systemUpdates: false,
  });
  const [sounds, setSounds] = useState({
    gameEffects: true,
    notifications: true,
    chat: true,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
    { id: 'sound', label: 'Sound', icon: <Volume2 className="w-4 h-4" /> },
  ];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar must be under 2MB');
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      const url = res.data?.url;
      if (url) {
        const fullUrl = url.startsWith('http')
          ? url
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`;
        setAvatarPreview(fullUrl);
        updateUser({ avatar: fullUrl });
        toast.success('Avatar uploaded');
      }
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ username, bio });
      updateUser({ username, bio });
    } catch {
      // Error handled by hook
    }
  };

  const handleSavePreferences = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-theme-primary flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary-400" />
            Settings
          </h1>
          <p className="text-theme-muted mt-1">Manage your account settings and preferences</p>
        </motion.div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'profile' && (
          <Card>
            <h3 className="text-lg font-semibold text-theme-primary mb-6">Profile Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar src={avatarPreview || user?.avatar} name={user?.username} size="xl" />
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    isLoading={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Change Avatar
                  </Button>
                  <p className="text-xs text-theme-muted mt-1">JPG, PNG, WebP. Max 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-muted mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-surface border border-surface-lighter rounded-xl px-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="border-t border-surface-lighter/30 pt-6">
                <h4 className="text-sm font-semibold text-theme-primary mb-4">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Current Password" type="password" placeholder="Enter current password" />
                  <Input label="New Password" type="password" placeholder="Enter new password" />
                </div>
              </div>
              <Button
                leftIcon={updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <h3 className="text-lg font-semibold text-theme-primary mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-surface-lighter/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-theme-primary capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-xs text-theme-muted">Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                  </div>
                  <Switch checked={value} onChange={(v) => setNotifications({ ...notifications, [key]: v })} />
                </div>
              ))}
              <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSavePreferences} className="mt-4">Save Changes</Button>
            </div>
          </Card>
        )}

        {activeTab === 'privacy' && (
          <Card>
            <h3 className="text-lg font-semibold text-theme-primary mb-6">Privacy Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-surface-lighter/20">
                <div>
                  <p className="text-sm font-medium text-theme-primary">Show Online Status</p>
                  <p className="text-xs text-theme-muted">Let others see when you&apos;re online</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-lighter/20">
                <div>
                  <p className="text-sm font-medium text-theme-primary">Public Profile</p>
                  <p className="text-xs text-theme-muted">Allow anyone to view your profile</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-surface-lighter/20">
                <div>
                  <p className="text-sm font-medium text-theme-primary">Allow Friend Requests</p>
                  <p className="text-xs text-theme-muted">Receive friend requests from anyone</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-theme-primary">Show Match History</p>
                  <p className="text-xs text-theme-muted">Display match history on your profile</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSavePreferences} className="mt-4">Save Changes</Button>
            </div>
          </Card>
        )}

        {activeTab === 'sound' && (
          <Card>
            <h3 className="text-lg font-semibold text-theme-primary mb-6">Sound Settings</h3>
            <div className="space-y-4">
              {Object.entries(sounds).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-surface-lighter/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-theme-primary capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  </div>
                  <Switch checked={value} onChange={(v) => setSounds({ ...sounds, [key]: v })} />
                </div>
              ))}
              <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSavePreferences} className="mt-4">Save Changes</Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
