'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Users, Zap, ArrowRight, Crown, Swords, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout/Footer';

const featuredGames = [
  { name: 'Tic Tac Toe', description: 'Classic strategy game', icon: '⭕', players: '2 Players', color: 'from-purple-500 to-pink-500' },
  { name: 'Connect Four', description: 'Drop to connect', icon: '🔴', players: '2 Players', color: 'from-cyan-500 to-blue-500' },
  { name: 'Chess', description: 'The ultimate mind game', icon: '♟️', players: '2 Players', color: 'from-amber-500 to-orange-500' },
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
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-surface-lighter/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-gaming flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              MultiGame
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden gaming-grid">
        <div className="absolute inset-0 bg-gradient-radial from-primary-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">Real-time multiplayer gaming</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
              <span className="text-white">Multiplayer</span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-green bg-clip-text text-transparent">
                Gaming Arena
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Play classic board games with players worldwide. Compete in tournaments, climb the leaderboard, and become the ultimate champion.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Play Now — Free
                </Button>
              </Link>
              <Link href="/games">
                <Button variant="outline" size="lg">
                  Browse Games
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {[Crown, Swords, Target].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface/50 border border-surface-lighter/30">
                <Icon className="w-8 h-8 text-primary-400" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Featured Games</h2>
            <p className="text-gray-400">Choose from our collection of classic multiplayer games</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredGames.map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 hover:border-primary-500/30 hover:shadow-glow-purple transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl mb-4`}>
                  {game.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{game.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{game.description}</p>
                <span className="text-xs text-primary-400 font-medium">{game.players}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400">Get started in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary-400" />
                </div>
                <div className="text-xs font-bold text-primary-400 mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8 rounded-2xl bg-surface/50 border border-surface-lighter/50"
              >
                <stat.icon className="w-8 h-8 text-secondary-400 mx-auto mb-3" />
                <div className="text-3xl font-display font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary-900/50 to-secondary-900/50 border border-primary-500/20">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Ready to Play?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join thousands of players and start competing today. Create your free account and enter the arena.
            </p>
            <Link href="/register">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
