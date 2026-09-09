'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface MindiSurrenderModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MindiSurrenderModal({ open, onCancel, onConfirm }: MindiSurrenderModalProps) {
  return (
    <Modal isOpen={open} onClose={onCancel} title="Surrender this table?" size="sm">
      <p className="text-sm text-theme-muted mb-5">
        Are you sure you want to surrender? Your team will lose this Mindi Cot match.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>
          Surrender
        </Button>
      </div>
    </Modal>
  );
}
