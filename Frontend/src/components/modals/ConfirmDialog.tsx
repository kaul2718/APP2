'use client';

import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  isLoading?: boolean;
  customActions?: React.ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onClose,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  isLoading = false,
  customActions,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    confirmButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar dialogo"
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          {customActions ? customActions : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${
                  destructive
                    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
