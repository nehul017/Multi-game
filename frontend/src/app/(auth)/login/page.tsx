'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Gamepad2, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      const user = useAuthStore.getState().user;
      toast.success('Welcome back!');
      router.push(user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Invalid credentials');
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
            <h2 className="text-4xl font-display font-bold text-theme-primary mb-4">Welcome Back</h2>
            <p className="text-theme-muted text-lg">Enter the arena and continue your journey to the top</p>
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

            <h1 className="text-3xl font-display font-bold text-theme-primary mb-2">Sign In</h1>
            <p className="text-theme-muted mb-8">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-500 hover:text-primary-400 font-medium">
                Sign up
              </Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-theme-primary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-theme bg-theme-secondary text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-theme-muted">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-400">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Sign In
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
