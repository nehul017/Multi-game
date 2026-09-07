'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionReveal({ children, className, id }: SectionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id={id} className="scroll-mt-24">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-72px' }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={className}
      >
        {children}
      </motion.div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionHeader({ title, href, linkLabel = 'View All →', className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-6 md:mb-8', className)}>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-theme-primary tracking-tight">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-primary-400 hover:text-primary-300 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-lg"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
