'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { apiRequest } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

interface AuditActorUser {
  id: number;
  nombre: string;
  apellido?: string | null;
}

interface AuditLogItem {
  id: string;
  actorUserId: number | null;
  actorUser?: AuditActorUser | null;
  actorRole: string | null;
  actorType: 'employee' | 'client' | 'system' | 'anonymous';
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  changedFields?: string[] | null;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string | null;
  userAgent?: string | null;
  requestId: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  success: boolean;
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const MODULE_LABELS: Record<string, string> = {
  auth: 'Autenticación',
  users: 'Usuarios',
  clients: 'Clientes',
  orders: 'Órdenes de Servicio',
  presupuestos: 'Presupuestos',
  inventario: 'Inventario y Compras',
  evidencias: 'Evidencias Técnicas',
  permissions: 'Roles y Permisos',
  audit: 'Auditoría',
};

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return value;
  }
}

function formatActorName(log: AuditLogItem): string {
  if (log.actorUser) {
    return `${log.actorUser.nombre} ${log.actorUser.apellido || ''}`.trim();
  }
  if (log.actorUserId) {
    return `Usuario #${log.actorUserId}`;
  }
  return log.actorType === 'anonymous' ? 'Visitante anónimo' : 'Sistema';
}

function formatDiffValue(val: unknown): string {
  if (val === undefined) return '—';
  if (val === null) return 'Nulo';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export default function AuditoriaInternaClient() {
  const { data: session, status: sessionStatus } = useSession();
  const { hasPermission, loading: permsLoading } = usePermissions();

  const canViewAudit = hasPermission('audit.view');
  const canViewDetail = hasPermission('audit.detail');

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [actorUserIdFilter, setActorUserIdFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Ordenamiento local sobre la página actual
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Detalle
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (targetPage: number, targetLimit: number) => {
      if (!session?.accessToken || !canViewAudit) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(targetPage));
        params.set('limit', String(targetLimit));
        if (fromDate) params.set('from', new Date(`${fromDate}T00:00:00`).toISOString());
        if (toDate) params.set('to', new Date(`${toDate}T23:59:59`).toISOString());
        if (moduleFilter) params.set('module', moduleFilter);
        if (statusFilter) params.set('status', statusFilter);
        if (actionFilter.trim()) params.set('action', actionFilter.trim());
        if (entityIdFilter.trim()) params.set('entityId', entityIdFilter.trim());
        if (actorUserIdFilter.trim()) params.set('actorUserId', actorUserIdFilter.trim());
        if (searchFilter.trim()) params.set('search', searchFilter.trim());

        const res = await apiRequest<AuditLogsResponse>(
          `/audit/logs?${params.toString()}`,
          {},
          session,
        );
        setItems(res.items || []);
        setTotal(res.total || 0);
        setPage(res.page || targetPage);
        setTotalPages(res.totalPages || 1);
      } catch (err: any) {
        if (err?.isAuthError || err?.status === 401) return;
        setError(err?.message || 'No se pudieron cargar los registros de auditoría.');
      } finally {
        setLoading(false);
      }
    },
    [
      session,
      canViewAudit,
      fromDate,
      toDate,
      moduleFilter,
      statusFilter,
      actionFilter,
      entityIdFilter,
      actorUserIdFilter,
      searchFilter,
    ],
  );

  useEffect(() => {
    if (sessionStatus === 'authenticated' && !permsLoading && canViewAudit) {
      void fetchLogs(page, limit);
    }
  }, [sessionStatus, permsLoading, canViewAudit, page, limit]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchLogs(1, limit);
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setModuleFilter('');
    setStatusFilter('');
    setActionFilter('');
    setEntityIdFilter('');
    setActorUserIdFilter('');
    setSearchFilter('');
    setPage(1);
  };

  const handleOpenDetail = async (id: string) => {
    if (!session?.accessToken || !canViewDetail) return;
    setSelectedLog({ id } as AuditLogItem);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await apiRequest<{ success: boolean; data: AuditLogItem }>(
        `/audit/logs/${id}`,
        {},
        session,
      );
      setSelectedLog(res.data);
    } catch (err: any) {
      setDetailError(err?.message || 'No se pudo cargar el detalle del registro.');
    } finally {
      setDetailLoading(false);
    }
  };

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });
    return copy;
  }, [items, sortOrder]);

  const diffKeys = useMemo(() => {
    if (!selectedLog) return [];
    const keys = new Set<string>([
      ...Object.keys(selectedLog.oldValues || {}),
      ...Object.keys(selectedLog.newValues || {}),
    ]);
    return Array.from(keys);
  }, [selectedLog]);

  if (sessionStatus === 'loading' || permsLoading) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        Verificando permisos de auditoría...
      </div>
    );
  }

  if (!canViewAudit) {
    return (
      <ComponentCard title="Acceso restringido">
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>No cuentas con el permiso necesario (`audit.view`) para consultar la auditoría interna.</span>
        </div>
      </ComponentCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-brand-500 shrink-0" aria-hidden="true" />
            <span>Actividad del sistema — Auditoría interna</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Registro inmutable (solo lectura) de operaciones críticas y eventos de seguridad.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchLogs(page, limit)}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Panel de Filtros */}
      <ComponentCard title="Filtros de búsqueda" desc="Rango máximo permitido por consulta: 90 días.">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="audit-from" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Fecha inicial
            </label>
            <input
              id="audit-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="audit-to" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Fecha final
            </label>
            <input
              id="audit-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="audit-module" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Módulo
            </label>
            <select
              id="audit-module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Todos los módulos</option>
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="audit-status" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <select
              id="audit-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="SUCCESS">Exitoso (SUCCESS)</option>
              <option value="FAILURE">Fallido (FAILURE)</option>
            </select>
          </div>

          <div>
            <label htmlFor="audit-entity-id" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Orden / ID de registro
            </label>
            <input
              id="audit-entity-id"
              type="text"
              placeholder="Ej: 12794"
              value={entityIdFilter}
              onChange={(e) => setEntityIdFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="audit-actor-id" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              ID Usuario responsable
            </label>
            <input
              id="audit-actor-id"
              type="number"
              min={1}
              placeholder="Ej: 4"
              value={actorUserIdFilter}
              onChange={(e) => setActorUserIdFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="audit-action" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Acción específica
            </label>
            <input
              id="audit-action"
              type="text"
              placeholder="Ej: BUDGET_APPROVED"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="audit-search" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Buscar descripción
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="audit-search"
                type="text"
                placeholder="Palabra clave..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="col-span-full flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              Limpiar
            </Button>
            <Button type="submit" variant="primary" className="inline-flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" aria-hidden="true" />
              <span>Aplicar filtros</span>
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Tabla de Eventos */}
      <ComponentCard
        title={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Eventos registrados ({total})</span>
            <div className="flex items-center gap-2 text-xs font-normal">
              <button
                type="button"
                onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Orden: {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}
              </button>
              <select
                aria-label="Registros por página"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value={10}>10 / pág</option>
                <option value={25}>25 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>
          </div>
        }
      >
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Cargando registros de auditoría...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron registros de auditoría para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Fecha y hora</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Responsable</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Módulo</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Acción</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Entidad</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Estado</th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedItems.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-300 font-mono">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {formatActorName(log)}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {log.actorRole || log.actorType}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-700 dark:text-gray-300">
                      {MODULE_LABELS[log.module] || log.module}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                        {log.action}
                      </div>
                      <div className="max-w-xs truncate text-[11px] text-gray-500 dark:text-gray-400" title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                          <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          Fallido
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {canViewDetail ? (
                        <button
                          type="button"
                          onClick={() => void handleOpenDetail(log.id)}
                          aria-label={`Ver detalle del evento ${log.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <EyeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ver</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Página {page} de {totalPages} ({total} registros)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                <span>Anterior</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs"
              >
                <span>Siguiente</span>
                <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </ComponentCard>

      {/* Modal de Detalle de Auditoría (Solo lectura) */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Detalle de Auditoría"
        className="max-w-3xl"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
            <h2 className="pr-8 text-lg font-bold text-gray-900 dark:text-white">
              Detalle del evento #{selectedLog?.id}
            </h2>
          </div>

          {detailLoading ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando detalles del evento...
            </div>
          ) : detailError ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300">
              {detailError}
            </div>
          ) : selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Descripción
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {selectedLog.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Responsable</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatActorName(selectedLog)} ({selectedLog.actorRole || selectedLog.actorType})
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Fecha y hora</span>
                  <span className="font-mono text-xs text-gray-900 dark:text-white">
                    {formatDateTime(selectedLog.createdAt)}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Módulo / Acción</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {MODULE_LABELS[selectedLog.module] || selectedLog.module} · {selectedLog.action}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Entidad / Resultado</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedLog.entityType ? `${selectedLog.entityType} #${selectedLog.entityId || ''}` : 'N/A'} ·{' '}
                    {selectedLog.status === 'SUCCESS' ? 'Exitoso' : 'Fallido'}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:col-span-2">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Trazabilidad técnica</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                    IP: {selectedLog.ipAddress || 'N/A'} | Request ID: {selectedLog.requestId || 'N/A'}
                  </span>
                </div>
              </div>

              {diffKeys.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Comparación de cambios permitidos
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Campo</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Valor anterior</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Valor nuevo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {diffKeys.map((key) => {
                          const isChanged = selectedLog.changedFields?.includes(key);
                          return (
                            <tr key={key} className={isChanged ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                              <td className="px-3 py-2 font-mono font-semibold text-gray-800 dark:text-gray-200">
                                {key}
                              </td>
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-400 break-all">
                                {formatDiffValue(selectedLog.oldValues?.[key])}
                              </td>
                              <td className="px-3 py-2 text-gray-900 dark:text-white break-all">
                                {formatDiffValue(selectedLog.newValues?.[key])}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
                <Button type="button" variant="outline" onClick={() => setSelectedLog(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

