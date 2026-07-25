'use client';

import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-surface/50 rounded-xl border border-surface-lighter/30',
        'overflow-x-auto scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-1',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shrink-0 whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-primary-600 text-white shadow-glow-purple'
              : 'text-theme-muted hover:text-theme-primary hover:bg-surface-light'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'ml-0.5 px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.id ? 'bg-white/20' : 'bg-surface-lighter'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
