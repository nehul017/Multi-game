'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { sectionReveal, staggerContainer } from '@/lib/motion';
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
        initial={reduceMotion ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-72px', amount: 0.12 }}
        variants={reduceMotion ? undefined : sectionReveal}
        className={className}
      >
        {children}
      </motion.div>
    </section>
  );
}

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

export function StaggerGrid({ children, className }: StaggerGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={reduceMotion ? undefined : staggerContainer}
    >
      {children}
    </motion.div>
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
      <h2 className="home-section-heading font-display text-2xl sm:text-3xl font-bold text-theme-primary tracking-tight">
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
