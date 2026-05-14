'use client';

import React from 'react';
import Badge from '@/components/ui/badge/Badge';
import { formatDate, formatUserName } from '@/lib/formatters';
import type { Order } from '@/types/order.types';
import { getEstadoColor } from '@/utils/badge-utils';
import { ArrowRightIcon, ArrowLeftIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

export interface ActionDef {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  isPrimary?: boolean;
}

interface OrdenCardProps {
  order: Order;
  actions: ActionDef[];
  primaryActionsCount?: number;
  overflowActionsLabel?: string;
  onAdvance?: () => void;
  onRetroceder?: () => void;
  isLastState?: boolean;
  isFirstState?: boolean;
  isHighlighted?: boolean;
}

export default function OrdenCard({
  order,
  actions = [],
  overflowActionsLabel = 'Más acciones',
  onAdvance,
  onRetroceder,
  isLastState = false,
  isFirstState = false,
  isHighlighted = false,
}: OrdenCardProps) {
  const primaryActions = actions.filter(a => a.isPrimary);
  const overflowActions = actions.filter(a => !a.isPrimary);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  const lastHistory = React.useMemo(() => {
    if (!order.historialEstados || order.historialEstados.length === 0) return null;
    return [...order.historialEstados].sort((a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime())[0];
  }, [order.historialEstados]);

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuButtonRef.current && !menuButtonRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className={`relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm md:flex-row md:items-center md:justify-between transition-all duration-700 ${
      isHighlighted 
        ? 'border-brand-500 bg-brand-50/50 dark:border-brand-500/50 dark:bg-brand-900/10 ring-2 ring-brand-500/20 shadow-md scale-[1.01] z-10' 
        : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
    }`}>
      {/* Decorative left border for status (optional) */}
      <div 
        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl opacity-75"
        style={{ backgroundColor: getEstadoColor(order.estadoOrden?.nombre || '') === 'success' ? '#10b981' : getEstadoColor(order.estadoOrden?.nombre || '') === 'warning' ? '#f59e0b' : '#3b82f6' }}
      ></div>

      <div className="flex flex-1 flex-col gap-3 pl-2">
        <div className="flex items-start justify-between md:items-center">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              #{order.workOrderNumber}
            </span>
            <Badge size="sm" color={getEstadoColor(order.estadoOrden?.nombre || '')}>
              {order.estadoOrden?.nombre || 'Sin estado'}
            </Badge>
            {order.presupuesto?.estado && (
              <Badge 
                size="sm" 
                color={
                  order.presupuesto.estado.nombre.toLowerCase().includes('aprob') ? 'success' :
                  order.presupuesto.estado.nombre.toLowerCase().includes('rechaz') ? 'error' : 'warning'
                }
              >
                Presupuesto: {order.presupuesto.estado.nombre}
              </Badge>
            )}
            {order.casillero && (
              <Badge size="sm" color="info">
                Casillero: {order.casillero.codigo}
              </Badge>
            )}
            {!order.estado && (
              <Badge size="sm" color="error">Inactiva</Badge>
            )}
          </div>
          {/* Mobile date */}
          <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
            {formatDate(order.createdAt)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {order.equipo?.numeroSerie || 'Equipo N/A'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {formatUserName(order.client)}
          </div>
        </div>

        {/* Detailed info visible mainly on desktop or expanded mobile */}
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-semibold">Técnico:</span> {formatUserName(order.technician)}
          </div>
          {order.fechaPrometidaEntrega && (
            <div className="hidden md:block">
              <span className="font-semibold">Promesa:</span> {formatDate(order.fechaPrometidaEntrega)}
            </div>
          )}
        </div>

        {/* Historial log */}
        {lastHistory && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="truncate">
              Actualizado a <strong>{lastHistory.estadoOrden?.nombre || 'Estado'}</strong> por {formatUserName(lastHistory.usuario)} el {formatDate(lastHistory.fechaCambio)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 md:pl-4">
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {primaryActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className || "rounded-full p-2 hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 transition-colors"}
              title={action.label}
            >
              {action.icon ? action.icon : <span className="px-2">{action.label}</span>}
            </button>
          ))}

          {overflowActions.length > 0 && (
            <div className="relative">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {overflowActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      disabled={action.disabled}
                      onClick={() => {
                        setIsMenuOpen(false);
                        action.onClick();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Retroceder button */}
          {onRetroceder && !isFirstState && (
            <button 
              onClick={onRetroceder}
              title="Retroceder ODS"
              className="flex items-center justify-center h-10 w-10 ml-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}

          {/* Siguiente Paso button */}
          {onAdvance && !isLastState && (
            <button 
              onClick={onAdvance}
              title="Avanzar ODS"
              className="flex items-center justify-center h-10 w-10 ml-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
