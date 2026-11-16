'use client';

import React from 'react';
import type { EstadoOrden } from '@/hooks/useEstadoOrden';

interface StateTabsBarProps {
  estados: EstadoOrden[];
  activeStateId: number | undefined;
  onStateChange: (estadoId: number | undefined) => void;
  // Opcional: Si el backend envía contadores, se pasarían aquí
  counts?: Record<number, number>;
  totalCount?: number;
}

export default function StateTabsBar({
  estados,
  activeStateId,
  onStateChange,
  counts = {},
  totalCount = 0,
}: StateTabsBarProps) {
  // Ordenamos los estados si es necesario, o confiamos en el orden del backend
  const activeEstados = (estados || []).filter(e => e?.estado);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onStateChange(undefined)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
            activeStateId === undefined
              ? 'border-transparent bg-brand-500 text-white shadow-sm'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Todas
        </button>

        {activeEstados.map((estado) => {
          const isActive = activeStateId === estado.id;
          return (
            <button
              key={estado.id}
              onClick={() => onStateChange(estado.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'border-transparent bg-brand-500 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {estado.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
