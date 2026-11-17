'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import {
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiRequest } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ClientActivitySummary {
  period: { from: string; to: string };
  metricsNote: string;
  totals: {
    totalEvents: number;
    lookupsStarted: number;
    lookupsSuccess: number;
    lookupsNotFound: number;
    distinctSessions: number;
    distinctAuthenticatedClients: number;
  };
  lookupsByDay: Array<{
    date: string;
    started: number;
    success: number;
    notFound: number;
  }>;
  topPages: Array<{ pagePath: string; views: number }>;
  topEvents: Array<{
    eventName: string;
    module: string;
    source?: 'backend' | 'frontend';
    count: number;
  }>;
  technicalUsage: {
    diagnosisViewed: number;
    budgetViewed: number;
    budgetApprovalStarted: number;
    budgetApprovalCancelled: number;
    evidenceSectionViewed: number;
    documentDownloadStarted: number;
  };
  errorsByPeriod: Array<{
    date: string;
    errorCode: string;
    count: number;
  }>;
}

const MODULE_OPTIONS = [
  { value: '', label: 'Todos los módulos' },
  { value: 'portal_publico', label: 'Portal público (/consulta)' },
  { value: 'portal_cliente', label: 'Portal cliente autenticado' },
  { value: 'presupuestos', label: 'Presupuestos' },
  { value: 'evidencias', label: 'Evidencias técnicas' },
  { value: 'recuperacion', label: 'Recuperación de acceso' },
  { value: 'navegacion', label: 'Navegación general' },
];

export default function ComportamientoClientesClient() {
  const { data: session, status: sessionStatus } = useSession();
  const { hasPermission, loading: permsLoading } = usePermissions();

  const canViewAnalytics = hasPermission('analytics.clients.view');

  const [rangePreset, setRangePreset] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const [summary, setSummary] = useState<ClientActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!session?.accessToken || !canViewAnalytics) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (rangePreset === 'custom') {
        if (fromDate) params.set('from', new Date(`${fromDate}T00:00:00`).toISOString());
        if (toDate) params.set('to', new Date(`${toDate}T23:59:59`).toISOString());
      } else {
        const now = new Date();
        const days = rangePreset === '7d' ? 7 : rangePreset === '90d' ? 90 : 30;
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        params.set('from', from.toISOString());
        params.set('to', now.toISOString());
      }
      if (moduleFilter) params.set('module', moduleFilter);

      const res = await apiRequest<{ success: boolean; data: ClientActivitySummary }>(
        `/client-activity/summary?${params.toString()}`,
        {},
        session,
      );
      setSummary(res.data);
    } catch (err: any) {
      if (err?.isAuthError || err?.status === 401) return;
      setError(err?.message || 'No se pudieron cargar las métricas de comportamiento de clientes.');
    } finally {
      setLoading(false);
    }
  }, [session, canViewAnalytics, rangePreset, fromDate, toDate, moduleFilter]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && !permsLoading && canViewAnalytics) {
      void fetchSummary();
    }
  }, [sessionStatus, permsLoading, canViewAnalytics, fetchSummary]);

  const totalErrors = useMemo(() => {
    if (!summary?.errorsByPeriod) return 0;
    return summary.errorsByPeriod.reduce((acc, item) => acc + Number(item.count || 0), 0);
  }, [summary]);

  const lookupsChartData = useMemo(() => {
    const rows = summary?.lookupsByDay || [];
    return {
      options: {
        chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#3B82F6', '#10B981', '#F43F5E'],
        stroke: { curve: 'smooth' as const, width: 2.5 },
        xaxis: {
          categories: rows.map((r) => r.date),
          labels: { style: { colors: '#9CA3AF', fontSize: '11px' } },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
          labels: { style: { colors: '#9CA3AF', fontSize: '11px' } },
        },
        legend: { position: 'top' as const, labels: { colors: '#9CA3AF' } },
        grid: { borderColor: 'rgba(156, 163, 175, 0.15)' },
        tooltip: { theme: 'dark' as const },
      },
      series: [
        { name: 'Iniciadas (Frontend)', data: rows.map((r) => r.started) },
        { name: 'Exitosas (Backend)', data: rows.map((r) => r.success) },
        { name: 'Sin resultados (Backend)', data: rows.map((r) => r.notFound) },
      ],
    };
  }, [summary]);

  const technicalChartData = useMemo(() => {
    const t = summary?.technicalUsage;
    const values = t
      ? [
          t.diagnosisViewed,
          t.budgetViewed,
          t.budgetApprovalStarted,
          t.budgetApprovalCancelled,
          t.evidenceSectionViewed,
          t.documentDownloadStarted,
        ]
      : [0, 0, 0, 0, 0, 0];

    return {
      options: {
        chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#6366F1'],
        plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '55%' } },
        dataLabels: { enabled: true },
        xaxis: {
          categories: [
            'Diagnóstico visto',
            'Presupuesto visto',
            'Inicio aprobación',
            'Aprobación cancelada',
            'Evidencias vistas',
            'Descargas PDF',
          ],
          labels: { style: { colors: '#9CA3AF', fontSize: '11px' } },
        },
        yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '11px' } } },
        grid: { borderColor: 'rgba(156, 163, 175, 0.15)' },
        tooltip: { theme: 'dark' as const },
      },
      series: [{ name: 'Eventos registrados', data: values }],
    };
  }, [summary]);

  if (sessionStatus === 'loading' || permsLoading) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        Verificando permisos de analítica...
      </div>
    );
  }

  if (!canViewAnalytics) {
    return (
      <ComponentCard title="Acceso restringido">
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>No cuentas con el permiso necesario (`analytics.clients.view`) para ver las métricas de clientes.</span>
        </div>
      </ComponentCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado y controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-brand-500 shrink-0" aria-hidden="true" />
            <span>Actividad del sistema — Comportamiento de clientes</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Métricas agregadas y anónimas del uso del portal público y privado.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchSummary()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Filtros de período y módulo */}
      <ComponentCard title="Período y filtros">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="analytics-range" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Período
            </label>
            <select
              id="analytics-range"
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="custom">Rango personalizado</option>
            </select>
          </div>

          <div>
            <label htmlFor="analytics-module" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Módulo
            </label>
            <select
              id="analytics-module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {rangePreset === 'custom' && (
            <>
              <div>
                <label htmlFor="analytics-from" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Fecha inicial
                </label>
                <input
                  id="analytics-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="analytics-to" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Fecha final
                </label>
                <input
                  id="analytics-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </>
          )}
        </div>
      </ComponentCard>

      {/* Nota metodológica */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/30 dark:text-blue-200">
        <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <p>
          <strong>Nota de interpretación:</strong>{' '}
          {summary?.metricsNote ||
            'Los conteos de eventos, consultas de órdenes, sesiones temporales opcionales y clientes autenticados únicos representan métricas distintas y no deben sumarse entre sí.'}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Cargando estadísticas agregadas...
        </div>
      ) : summary && (
        <>
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total de eventos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals.totalEvents}</p>
              <p className="mt-1 text-[11px] text-gray-400">Interacciones + eventos de servidor</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Consultas de órdenes</p>
                <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totals.lookupsSuccess + summary.totals.lookupsNotFound}
              </p>
              <div className="mt-1 flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {summary.totals.lookupsSuccess} exitosas
                </span>
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {summary.totals.lookupsNotFound} sin resultado
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Sesiones vs. Clientes</p>
                <UserGroupIcon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totals.distinctAuthenticatedClients}{' '}
                <span className="text-xs font-normal text-gray-500">clientes únicos</span>
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {summary.totals.distinctSessions} sesiones temporales (con consentimiento)
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Errores registrados</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{totalErrors}</p>
              <p className="mt-1 text-[11px] text-gray-400">
                Iniciadas desde UI: {summary.totals.lookupsStarted}
              </p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ComponentCard
              title="Consultas de órdenes por día"
              desc="Comparativa entre consultas iniciadas (Frontend) y resultados confirmados (Backend)."
            >
              {summary.lookupsByDay.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  Sin consultas registradas en el período seleccionado.
                </div>
              ) : (
                <div className="min-h-[280px]">
                  <ReactApexChart
                    options={lookupsChartData.options}
                    series={lookupsChartData.series}
                    type="line"
                    height={280}
                  />
                </div>
              )}
            </ComponentCard>

            <ComponentCard
              title="Uso de información técnica y presupuestos"
              desc="Visualizaciones de diagnóstico, presupuesto, evidencias y descargas de documentos."
            >
              <div className="min-h-[280px]">
                <ReactApexChart
                  options={technicalChartData.options}
                  series={technicalChartData.series}
                  type="bar"
                  height={280}
                />
              </div>
            </ComponentCard>
          </div>

          {/* Tablas agregadas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ComponentCard title="Páginas más consultadas">
              {summary.topPages.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Sin datos de navegación en este período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-800">
                    <thead>
                      <tr>
                        <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Ruta sanitizada</th>
                        <th className="py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Eventos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {summary.topPages.map((row) => (
                        <tr key={row.pagePath}>
                          <td className="py-2 font-mono text-gray-800 dark:text-gray-200">{row.pagePath}</td>
                          <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{row.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ComponentCard>

            <ComponentCard title="Eventos más frecuentes (Origen Backend vs. Frontend)">
              {summary.topEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Sin eventos registrados en este período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-800">
                    <thead>
                      <tr>
                        <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Evento</th>
                        <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Origen</th>
                        <th className="py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {summary.topEvents.map((ev, idx) => (
                        <tr key={`${ev.eventName}-${ev.source || 'na'}-${idx}`}>
                          <td className="py-2">
                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{ev.eventName}</span>
                            <span className="ml-2 text-[11px] text-gray-500">{ev.module}</span>
                          </td>
                          <td className="py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                ev.source === 'backend'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              }`}
                            >
                              {ev.source === 'backend' ? 'Backend (Confirmado)' : 'Frontend (UX)'}
                            </span>
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{ev.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ComponentCard>
          </div>

          {/* Errores por fecha y categoría */}
          <ComponentCard title="Errores registrados por fecha y categoría">
            {summary.errorsByPeriod.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No se registraron errores de flujo de clientes en este período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-800">
                  <thead>
                    <tr>
                      <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                      <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Código / Categoría</th>
                      <th className="py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Ocurrencias</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {summary.errorsByPeriod.map((err, idx) => (
                      <tr key={`${err.date}-${err.errorCode}-${idx}`}>
                        <td className="py-2 font-mono text-gray-700 dark:text-gray-300">{err.date}</td>
                        <td className="py-2 font-mono font-semibold text-rose-700 dark:text-rose-300">{err.errorCode}</td>
                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{err.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ComponentCard>
        </>
      )}
    </div>
  );
}

