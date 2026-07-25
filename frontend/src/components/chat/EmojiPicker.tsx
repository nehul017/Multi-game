'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const emojis = ['😀', '😂', '🎮', '🏆', '👏', '🔥', '💪', '🎯', '⭐', '❤️', '👍', '👎', '😎', '🤔', '😡', '😢', '🥳', '✌️', '💀', '🙌'];

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface-light transition-colors"
      >
        <Smile className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 p-3 bg-surface border border-surface-lighter rounded-xl shadow-2xl z-50"
          >
            <div className="grid grid-cols-5 gap-1 w-48">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-light text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
