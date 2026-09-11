'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Flag, MessageSquare, RotateCcw, X } from 'lucide-react';

interface ConfirmState {
  kind: 'resign' | 'exit' | null;
}

interface CarromOverlaysProps {
  statusText: string;
  showStatus: boolean;
  countdown: number | null;
  waiting: boolean;
  botEta: number;
  onFillBot: () => void;
  settingsOpen: boolean;
  onCloseSettings: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onResign: () => void;
  onExit: () => void;
  onRematch: () => void;
  canResign: boolean;
  confirm: ConfirmState;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  chatMessages: Array<{ user: string; text: string }>;
  chatInput: string;
  onChatInput: (value: string) => void;
  onSendChat: () => void;
  result: 'victory' | 'defeat' | 'draw' | null;
  resultDetail?: string;
}

export function CarromOverlays({
  statusText,
  showStatus,
  countdown,
  waiting,
  botEta,
  onFillBot,
  settingsOpen,
  onCloseSettings,
  muted,
  onToggleMute,
  onResign,
  onExit,
  onRematch,
  canResign,
  confirm,
  onConfirm,
  onCancelConfirm,
  chatOpen,
  onToggleChat,
  chatMessages,
  chatInput,
  onChatInput,
  onSendChat,
  result,
  resultDetail,
}: CarromOverlaysProps) {
  return (
    <>
      <AnimatePresence>
        {countdown !== null && (
          <motion.div className="carrom-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span
              key={countdown}
              className="carrom-countdown"
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {countdown || 'Play'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {waiting && (
          <motion.div className="carrom-wait" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p>Waiting for opponent</p>
            <span>A bot joins in {botEta}s</span>
            <button type="button" onClick={onFillBot}>
              <Bot className="w-4 h-4" />
              Play vs Bot now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatus && statusText && !waiting && (
          <motion.div className="carrom-toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {statusText}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <motion.aside className="carrom-drawer" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
            <div className="carrom-drawer-head">
              <p>Table settings</p>
              <button type="button" onClick={onCloseSettings} aria-label="Close settings">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button type="button" onClick={onToggleMute}>
              Sound {muted ? 'off' : 'on'}
            </button>
            <button type="button" onClick={onToggleChat}>
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button type="button" onClick={onRematch}>
              <RotateCcw className="w-4 h-4" />
              Rematch
            </button>
            <button type="button" className="is-danger" onClick={onResign} disabled={!canResign}>
              <Flag className="w-4 h-4" />
              Resign
            </button>
            <button type="button" onClick={onExit}>
              Exit table
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.div className="carrom-chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="carrom-chat-log">
              {chatMessages.length === 0 && <p>No messages yet</p>}
              {chatMessages.map((msg, index) => (
                <p key={`${msg.user}-${index}`}>
                  <strong>{msg.user}:</strong> {msg.text}
                </p>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSendChat();
              }}
            >
              <input
                value={chatInput}
                onChange={(event) => onChatInput(event.target.value)}
                placeholder="Message the table..."
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm.kind && (
          <motion.div className="carrom-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="carrom-confirm">
              <p>{confirm.kind === 'resign' ? 'Resign this match?' : 'Leave the table?'}</p>
              <div>
                <button type="button" onClick={onCancelConfirm}>
                  Cancel
                </button>
                <button type="button" className="is-danger" onClick={onConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div className="carrom-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="carrom-result">
              <p className="carrom-brand-sub">Carrom Classic</p>
              <h2>{result === 'victory' ? 'Victory' : result === 'defeat' ? 'Defeat' : 'Draw'}</h2>
              {resultDetail && <p>{resultDetail}</p>}
              <div>
                <button type="button" onClick={onRematch}>
                  Rematch
                </button>
                <button type="button" onClick={onExit}>
                  Exit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
