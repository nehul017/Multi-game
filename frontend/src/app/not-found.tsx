'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2, Home, Search } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background gaming-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary-900/20 via-transparent to-transparent" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-600/10 rounded-full blur-3xl" />

      <nav className="relative z-10 border-b border-surface-lighter/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="font-display text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              MultiGame
            </span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl w-full text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
            <Search className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300">Page not found</span>
          </div>

          <h1 className="font-display text-8xl md:text-9xl font-black mb-4 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-green bg-clip-text text-transparent glow-text">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            This level doesn&apos;t exist
          </h2>

          <p className="text-gray-400 text-base md:text-lg mb-10 max-w-md mx-auto">
            The page you&apos;re looking for may have been moved, deleted, or never existed in the arena.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button size="lg" leftIcon={<Home className="w-5 h-5" />}>
                Back to Home
              </Button>
            </Link>
            <Link href="/games">
              <Button variant="outline" size="lg" leftIcon={<Gamepad2 className="w-5 h-5" />}>
                Browse Games
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </motion.div>
      </main>
    </div>
  );
}
