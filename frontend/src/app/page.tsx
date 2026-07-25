'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Users,
  Zap,
  ArrowRight,
  Crown,
  Swords,
  Target,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout/Footer';
import { AppShell } from '@/components/layout/AppShell';
import { useUIStore } from '@/store/ui.store';

const featuredGames = [
  { name: 'Tic Tac Toe', description: 'Classic strategy game', icon: '⭕', players: '2 Players', color: 'from-primary-500 to-primary-700' },
  { name: 'Connect Four', description: 'Drop to connect', icon: '🔴', players: '2 Players', color: 'from-primary-400 to-primary-600' },
  { name: 'Chess', description: 'The ultimate mind game', icon: '♟️', players: '2 Players', color: 'from-primary-600 to-primary-800' },
];

const stats = [
  { label: 'Active Players', value: '10K+', icon: Users },
  { label: 'Games Played', value: '500K+', icon: Gamepad2 },
  { label: 'Tournaments', value: '200+', icon: Trophy },
];

const steps = [
  { step: 1, title: 'Create Account', description: 'Sign up in seconds and create your gaming profile', icon: Users },
  { step: 2, title: 'Choose Your Game', description: 'Browse our collection of multiplayer games', icon: Gamepad2 },
  { step: 3, title: 'Start Playing', description: 'Match with players and climb the leaderboard', icon: Zap },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <AppShell>
      <div className="min-h-screen flex flex-col">
        <nav className="fixed top-0 w-full z-50 glass-nav">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-purple shrink-0">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold gradient-text truncate">MultiGame</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 sm:p-2.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 transition-colors"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" className="px-2.5 sm:px-3">
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Get Started</span>
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <section className="relative pt-32 pb-24 px-4 overflow-hidden">
          <div className="relative max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-primary-500 font-medium">Real-time multiplayer gaming</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold mb-4 sm:mb-6 tracking-tight">
                <span className="text-theme-primary">Multiplayer</span>
                <br />
                <span className="gradient-text">Gaming Arena</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-theme-muted max-w-2xl mx-auto mb-8 sm:mb-10 px-1">
                Play classic board games with players worldwide. Compete in tournaments, climb the leaderboard, and become the ultimate champion.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Play Now — Free
                  </Button>
                </Link>
                <Link href="/games">
                  <Button variant="secondary" size="lg">
                    Browse Games
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-12 sm:mt-16 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto"
            >
              {[Crown, Swords, Target].map((Icon, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -6, scale: 1.05 }}
                  className="flex flex-col items-center gap-2 p-3 sm:p-5 rounded-2xl sm:rounded-3xl surface-card glow-border"
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500 animate-icon-float" style={{ animationDelay: `${i * 0.5}s` }} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-theme-primary mb-4">
                Featured Games
              </h2>
              <p className="text-theme-muted">Choose from our collection of classic multiplayer games</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {featuredGames.map((game, i) => (
                <motion.div
                  key={game.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="group surface-card p-7 card-hover glow-border"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl mb-5 shadow-glow-purple`}>
                    {game.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-theme-primary font-display mb-2">{game.name}</h3>
                  <p className="text-theme-muted text-sm mb-4">{game.description}</p>
                  <span className="text-xs text-primary-500 font-semibold">{game.players}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 bg-theme-secondary/50 border-y border-theme">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-theme-primary mb-4">
                How It Works
              </h2>
              <p className="text-theme-muted">Get started in three simple steps</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center mx-auto mb-5 shadow-glow-purple">
                    <item.icon className="w-7 h-7 text-primary-500" />
                  </div>
                  <div className="text-xs font-bold text-primary-500 mb-2 tracking-wider">STEP {item.step}</div>
                  <h3 className="text-lg font-semibold text-theme-primary font-display mb-2">{item.title}</h3>
                  <p className="text-sm text-theme-muted">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-8 rounded-3xl surface-card glow-border"
                >
                  <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                  <div className="text-3xl font-display font-bold text-theme-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-theme-muted">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="p-6 sm:p-10 md:p-12 rounded-3xl surface-card glow-border relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-theme-primary mb-4">
                  Ready to Play?
                </h2>
                <p className="text-theme-muted mb-8 max-w-lg mx-auto">
                  Join thousands of players and start competing today. Create your free account and enter the arena.
                </p>
                <Link href="/register">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </AppShell>
  );
}
