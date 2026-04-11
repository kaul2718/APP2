'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => Promise<void>;
  loading?: boolean;
  mode: 'create' | 'edit' | 'view';
  children: React.ReactNode;
  submitLabel?: string;
  hideActions?: boolean;
}

export default function CrudModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  loading = false,
  mode,
  children,
  submitLabel,
  hideActions = false,
}: CrudModalProps) {
  const isViewMode = mode === 'view';

  const defaultLabelByMode: Record<'create' | 'edit' | 'view', string> = {
    create: 'Crear',
    edit: 'Guardar cambios',
    view: 'Cerrar',
  };

  const primaryLabel = submitLabel ?? defaultLabelByMode[mode];

  const handlePrimaryAction = async () => {
    if (isViewMode) {
      onClose();
      return;
    }

    await onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="mx-4 w-full max-w-2xl p-6">
      <div className="space-y-5">
        <h2 className="pr-10 text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>

        <div>{children}</div>

        {!hideActions && (
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handlePrimaryAction}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Procesando...' : primaryLabel}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
