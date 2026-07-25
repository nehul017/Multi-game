'use client';

import { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  tilt?: boolean;
  glow?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function Card({
  children,
  className,
  hover = false,
  tilt = false,
  glow = false,
  onClick,
  delay = 0,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={
        tilt
          ? {
              rotateX,
              rotateY,
              transformPerspective: 1000,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
      whileHover={
        hover || tilt
          ? { y: -6, scale: 1.02, transition: { duration: 0.3 } }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        'surface-card p-4 sm:p-6 transition-shadow duration-300',
        (hover || tilt) && 'card-hover glow-border cursor-pointer',
        glow && 'shadow-glow-purple',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-5', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-theme-primary font-display', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary-500',
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  delay?: number;
}) {
  return (
    <Card hover tilt glow delay={delay} className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-[0.06] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-center gap-3 sm:gap-4 relative min-w-0">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={cn(
            'p-2.5 sm:p-3.5 rounded-2xl bg-theme-secondary border border-theme shrink-0',
            iconColor
          )}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-float" />
        </motion.div>
        <div className="min-w-0">
          <div className="stat-value truncate">{value}</div>
          <p className="text-xs sm:text-sm text-theme-muted mt-0.5 truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}
