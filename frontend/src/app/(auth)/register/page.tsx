'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Gamepad2, Check, X, Sun, Moon, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const passwordChecks = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Contains special character', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: searchParams?.get('ref')?.toUpperCase() || '',
    },
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data.username, data.email, data.password, data.referralCode?.trim() || undefined);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen flex relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="hidden lg:flex lg:w-1/2 relative bg-theme-secondary items-center justify-center overflow-hidden border-r border-theme">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 text-center px-12"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow-purple"
            >
              <Gamepad2 className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-4xl font-display font-bold text-theme-primary mb-4">Join the Arena</h2>
            <p className="text-theme-muted text-lg">Create your account and start your competitive journey</p>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md surface-card p-5 sm:p-8 rounded-card"
          >
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-purple">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">MultiGame</span>
            </div>

            <h1 className="text-3xl font-display font-bold text-theme-primary mb-2">Create Account</h1>
            <p className="text-theme-muted mb-8">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium">
                Sign in
              </Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Username"
                placeholder="Choose a username"
                icon={<User className="w-4 h-4" />}
                error={errors.username?.message}
                {...register('username')}
              />

              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  icon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-theme-primary">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                />
                {password && (
                  <div className="mt-3 space-y-1.5">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2">
                        {check.test(password) ? (
                          <Check className="w-3 h-3 text-theme-success" />
                        ) : (
                          <X className="w-3 h-3 text-theme-muted" />
                        )}
                        <span className={cn('text-xs', check.test(password) ? 'text-theme-success' : 'text-theme-muted')}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Input
                label="Referral Code (optional)"
                placeholder="Enter a friend's code for bonus coins"
                icon={<Gift className="w-4 h-4" />}
                error={errors.referralCode?.message}
                {...register('referralCode')}
              />

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 rounded border-theme bg-theme-secondary text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-theme-muted">
                  I agree to the{' '}
                  <Link href="#" className="text-primary-500 hover:text-primary-400">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="#" className="text-primary-500 hover:text-primary-400">Privacy Policy</Link>
                </span>
              </label>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Create Account
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
