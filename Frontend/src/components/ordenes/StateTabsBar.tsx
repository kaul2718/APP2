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
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">

        {activeEstados.map((estado) => {
          const isActive = activeStateId === estado.id;
          return (
            <button
              key={estado.id}
              onClick={() => onStateChange(estado.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-transparent bg-brand-500 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {estado.nombre}
              {/* <span className={`flex h-5 items-center justify-center rounded-full px-2 text-xs ${isActive ? 'bg-black/10 text-gray-900' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {counts[estado.id] || 0}
              </span> */}
            </button>
          );
        })}
      </div>
    </div>
  );
}
