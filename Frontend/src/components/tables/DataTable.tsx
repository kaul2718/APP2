'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface ActionDef {
  key: string;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface DataTableProps<T> {
  caption: string;
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  showInactive?: boolean;
  onToggleInactive?: () => void;
  showControls?: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  actions?: (row: T) => ActionDef[];
  renderActions?: (row: T) => React.ReactNode;
  getRowKey: (row: T) => string | number;
  primaryActionsCount?: number;
  overflowActionsLabel?: string;
}

export function DataTable<T>({
  caption,
  data,
  columns,
  loading,
  searchTerm = "",
  onSearchChange,
  showInactive = false,
  onToggleInactive,
  showControls = true,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  actions,
  renderActions,
  getRowKey,
  primaryActionsCount = 3,
  overflowActionsLabel = 'Mas acciones',
}: DataTableProps<T>) {
  const searchInputId = React.useId();
  const inactiveCheckboxId = React.useId();
  const [openActionsMenuRowKey, setOpenActionsMenuRowKey] = useState<string | number | null>(null);

  useEffect(() => {
    if (openActionsMenuRowKey === null) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-datatable-actions-root]')) {
        setOpenActionsMenuRowKey(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionsMenuRowKey(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openActionsMenuRowKey]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {showControls && (
        <div className="border-b border-gray-100 p-4 dark:border-white/[0.05]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar..."
              aria-label="Buscar registros"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-sm"
            />

            <label htmlFor={inactiveCheckboxId} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                id={inactiveCheckboxId}
                type="checkbox"
                checked={showInactive}
                onChange={onToggleInactive}
                className="h-4 w-4"
              />
              Mostrar inactivos
            </label>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-gray-700 dark:text-gray-300 ${column.className ?? ''}`}
                >
                  {column.header}
                </TableHead>
              ))}
              {(actions || renderActions) && <TableHead className="text-gray-700 dark:text-gray-300">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions || renderActions ? 1 : 0)}
                  className="py-6 text-center text-gray-600 dark:text-gray-300"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions || renderActions ? 1 : 0)}
                  className="py-6 text-center text-gray-600 dark:text-gray-300"
                >
                  Sin registros
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const rowKey = getRowKey(row);
                const rowActions = actions?.(row) ?? [];
                const primaryActions = rowActions.slice(0, primaryActionsCount);
                const overflowActions = rowActions.slice(primaryActionsCount);
                const isMenuOpen = openActionsMenuRowKey === rowKey;
                const menuButtonId = `datatable-actions-button-${String(rowKey)}`;
                const menuId = `datatable-actions-menu-${String(rowKey)}`;

                return (
                <TableRow key={rowKey}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={`text-gray-700 dark:text-gray-300 ${column.className ?? ''}`}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                  {(actions || renderActions) && (
                    <TableCell>
                      {renderActions ? (
                        renderActions(row)
                      ) : (
                        <div className="flex flex-wrap items-center gap-2" data-datatable-actions-root>
                          {primaryActions.map((action) => (
                            <button
                              key={action.key}
                              type="button"
                              onClick={() => {
                                setOpenActionsMenuRowKey(null);
                                action.onClick();
                              }}
                              disabled={action.disabled}
                              className={
                                action.className ??
                                'rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              }
                            >
                              {action.label}
                            </button>
                          ))}

                          {overflowActions.length > 0 && (
                            <div className="relative">
                              <button
                                id={menuButtonId}
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                                aria-controls={menuId}
                                onClick={() => setOpenActionsMenuRowKey(isMenuOpen ? null : rowKey)}
                                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                {overflowActionsLabel}
                              </button>

                              {isMenuOpen && (
                                <div
                                  id={menuId}
                                  role="menu"
                                  aria-labelledby={menuButtonId}
                                  className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                >
                                  {overflowActions.map((action) => (
                                    <button
                                      key={action.key}
                                      type="button"
                                      role="menuitem"
                                      disabled={action.disabled}
                                      onClick={() => {
                                        setOpenActionsMenuRowKey(null);
                                        action.onClick();
                                      }}
                                      className={
                                        action.className ??
                                        'w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700'
                                      }
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-700 dark:border-white/[0.05] dark:text-gray-300">
        <span className="text-gray-700 dark:text-gray-300">Total: {totalItems}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Pagina anterior"
          >
            Anterior
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            {currentPage} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Pagina siguiente"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
