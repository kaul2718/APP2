'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ReportType,
  DatePreset,
  ReportFilterState,
  ReportFilterOptions,
  ReportKpi,
} from '@/components/reportes/types';
import { ReportFilterBar } from '@/components/reportes/ReportFilterBar';
import { ReportKpiCards } from '@/components/reportes/ReportKpiCards';
import { ReportDataTable } from '@/components/reportes/ReportDataTable';
import { ReportExportActions } from '@/components/reportes/ReportExportActions';
import { ReportPreviewModal } from '@/components/reportes/ReportPreviewModal';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ClientComponentProps {
  initialTab?: ReportType | string;
  standalone?: boolean;
}

const REPORT_TITLES: Record<ReportType, string> = {
  orders: 'Reporte General de Órdenes de Servicio',
  delivered: 'Reporte de Equipos Recibidos vs. Físicamente Entregados',
  delayed: 'Reporte de Órdenes Atrasadas y Tiempos de Atención SLA',
  budgets: 'Reporte de Presupuestos y Tasa de Conversión',
  inventory: 'Reporte de Inventario Físico y Valoración de Almacén',
  techs: 'Reporte de Productividad y Carga de Trabajo por Técnico',
  clients: 'Reporte de Clientes y Equipos Recurrentes',
  purchases: 'Reporte de Compras a Proveedores',
};

// Mapear pestaña inicial de forma segura soportando nombres en inglés, español y aliases
const normalizeTab = (tab?: string | null): ReportType => {
  if (!tab) return 'orders';
  const clean = String(tab).toLowerCase().trim();
  if (['inventory', 'inventario', 'stock'].includes(clean)) return 'inventory';
  if (['purchases', 'compras', 'compra', 'proveedores'].includes(clean)) return 'purchases';
  if (['budgets', 'budget', 'presupuestos', 'presupuesto'].includes(clean)) return 'budgets';
  if (['techs', 'tech', 'tecnicos', 'tecnico', 'technicians', 'technician'].includes(clean)) return 'techs';
  if (['clients', 'client', 'clientes', 'cliente', 'recurring-clients'].includes(clean)) return 'clients';
  if (['delivered', 'entregas', 'entrega', 'equipos', 'equipo', 'equip', 'equipos-entregados'].includes(clean)) return 'delivered';
  if (['delayed', 'atrasadas', 'atrasada', 'sla'].includes(clean)) return 'delayed';
  return 'orders';
};

export default function ClientComponent({
  initialTab = 'orders',
  standalone = false,
}: ClientComponentProps) {
  const { data: session } = useSession();
  const { role, hasPermission, loading: permissionsLoading } = usePermissions();
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get('tab') || searchParams?.get('type');

  const [filters, setFilters] = useState<ReportFilterState>(() => ({
    reportType: normalizeTab(queryTab || initialTab),
    preset: 'month',
    startDate: '',
    endDate: '',
    tecnicoId: '',
    estadoId: '',
    tipoOrden: 'todos',
    filtroStock: 'todos',
    tipoItem: 'productos',
    search: '',
    page: 1,
    limit: 25,
  }));

  // Sincronizar reporte si cambia la prop initialTab o query param
  useEffect(() => {
    const target = queryTab || initialTab;
    const normalized = normalizeTab(target);
    setFilters((prev) => {
      if (prev.reportType !== normalized) {
        setData([]);
        setKpis([]);
        return {
          ...prev,
          reportType: normalized,
          tipoItem: normalized === 'inventory' ? 'productos' : prev.tipoItem,
          page: 1,
        };
      }
      return prev;
    });
  }, [initialTab, queryTab]);

  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions>({
    estados: [],
    tecnicos: [],
    estadosPresupuesto: [],
    tiposOrden: [
      { id: 'todos', label: 'Todos' },
      { id: 'EXPRESS', label: 'Express' },
      { id: 'COMPLETA', label: 'Completa' },
    ],
    filtrosStock: [
      { id: 'todos', label: 'Todos' },
      { id: 'critico', label: 'Stock Crítico' },
      { id: 'agotado', label: 'Agotado (0)' },
      { id: 'disponible', label: 'Disponible' },
    ],
  });

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [kpis, setKpis] = useState<ReportKpi[]>([]);
  const [dateRangeLabel, setDateRangeLabel] = useState('Este Mes');
  const [disclosure, setDisclosure] = useState<string | null>(null);
  const [topConsumed, setTopConsumed] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const token = session?.accessToken;

  // Verificación de permisos según RBAC del sistema
  const canView = role === 'admin' || hasPermission('reportes.view');
  const canExport = role === 'admin' || hasPermission('reportes.export');

  // 1. Cargar opciones de filtros al montar
  useEffect(() => {
    if (!token) return;
    const fetchOptions = async () => {
      try {
        const res = await fetch(`${backendUrl}/reports/filters`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const opts = await res.json();
          setFilterOptions((prev) => ({
            ...prev,
            ...opts,
          }));
        }
      } catch (err) {
        console.warn('No se pudieron cargar opciones de filtro:', err);
      }
    };
    fetchOptions();
  }, [backendUrl, token]);

  // 2. Cargar datos del reporte actual
  const loadReportData = useCallback(async () => {
    if (!token || !canView) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.append('preset', filters.preset);
      if (filters.preset === 'custom' && filters.startDate && filters.endDate) {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }
      if (filters.tecnicoId) params.append('tecnicoId', filters.tecnicoId);
      if (filters.estadoId) params.append('estadoId', filters.estadoId);
      if (filters.tipoOrden && filters.tipoOrden !== 'todos') params.append('tipoOrden', filters.tipoOrden);
      if (filters.filtroStock && filters.filtroStock !== 'todos') params.append('filtroStock', filters.filtroStock);
      if (filters.reportType === 'inventory' && filters.tipoItem) params.append('tipoItem', filters.tipoItem);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(filters.page));
      params.append('limit', String(filters.limit));

      let endpoint = 'orders';
      if (filters.reportType === 'delivered') endpoint = 'delivered-vs-received';
      else if (filters.reportType === 'delayed') endpoint = 'delayed-sla';
      else if (filters.reportType === 'budgets') endpoint = 'budgets';
      else if (filters.reportType === 'inventory') endpoint = 'inventory';
      else if (filters.reportType === 'techs') endpoint = 'technicians';
      else if (filters.reportType === 'clients') endpoint = 'recurring-clients';
      else if (filters.reportType === 'purchases') endpoint = 'purchases';

      const res = await fetch(`${backendUrl}/reports/${endpoint}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo cargar el reporte`);
      }

      const result = await res.json();

      if (filters.reportType === 'delayed') {
        setData(result.delayedOrders || []);
        setTotal(result.totalAtrasadas || 0);
        setTotalPages(1);
      } else if (filters.reportType === 'techs') {
        setData(result.technicians || []);
        setTotal(result.technicians?.length || 0);
        setTotalPages(1);
      } else if (filters.reportType === 'clients') {
        setData(result.recurringClients || []);
        setTotal(result.recurringClients?.length || 0);
        setTotalPages(1);
      } else {
        setData(result.data || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }

      setKpis(result.kpis || []);
      setDisclosure(result.disclosure || null);
      setTopConsumed(result.topConsumed || []);
      setTopServices(result.topServices || []);
      if (result.dateRangeLabel) {
        setDateRangeLabel(result.dateRangeLabel);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al comunicarse con el servidor');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, token, canView, filters]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // 3. Manejadores de Exportación Binaria Real
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!token || !canExport) return;
    const isExcel = format === 'excel';
    if (isExcel) setIsExportingExcel(true);
    else setIsExportingPdf(true);

    try {
      const params = new URLSearchParams();
      params.append('type', filters.reportType);
      params.append('preset', filters.preset);
      if (filters.preset === 'custom' && filters.startDate && filters.endDate) {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }
      if (filters.tecnicoId) params.append('tecnicoId', filters.tecnicoId);
      if (filters.estadoId) params.append('estadoId', filters.estadoId);
      if (filters.tipoOrden && filters.tipoOrden !== 'todos') params.append('tipoOrden', filters.tipoOrden);
      if (filters.filtroStock && filters.filtroStock !== 'todos') params.append('filtroStock', filters.filtroStock);
      if (filters.reportType === 'inventory' && filters.tipoItem) params.append('tipoItem', filters.tipoItem);
      if (filters.search) params.append('search', filters.search);

      const endpoint = isExcel ? 'export/excel' : 'export/pdf';
      const res = await fetch(`${backendUrl}/reports/${endpoint}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let errMsg = `Error en servidor (${res.status}) al generar ${format.toUpperCase()}`;
        try {
          const errData = await res.json();
          if (errData?.message) {
            errMsg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const ext = isExcel ? 'xlsx' : 'pdf';
      const filename = `reporte_${filters.reportType}_${Date.now()}.${ext}`;

      // Crear enlace temporal de descarga segura
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`No se pudo descargar el archivo: ${err.message}`);
    } finally {
      if (isExcel) setIsExportingExcel(false);
      else setIsExportingPdf(false);
    }
  };

  // Estado si no tiene permisos
  if (!permissionsLoading && !canView) {
    return (
      <div className="p-8 text-center bg-gray-900 border border-red-500/30 rounded-2xl max-w-lg mx-auto my-12 shadow-xl">
        <div className="inline-flex items-center justify-center p-3.5 bg-red-500/10 rounded-full mb-3 text-red-400">
          <LockClosedIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white">Acceso Restringido</h3>
        <p className="text-xs text-gray-400 mt-2">
          Tu rol actual no tiene asignado el permiso <span className="font-mono text-red-400">reportes.view</span>.
          Solicita autorización a la administración para consultar métricas y reportes del sistema.
        </p>
      </div>
    );
  }

  const currentTitle =
    filters.reportType === 'inventory'
      ? filters.tipoItem === 'servicios'
        ? 'Catálogo de Tarifas y Servicios Técnicos'
        : filters.tipoItem === 'todos'
        ? 'Reporte de Catálogo e Inventario General'
        : 'Reporte de Inventario Físico y Valoración de Almacén'
      : REPORT_TITLES[filters.reportType] || 'Reporte Administrativo';

  return (
    <div className="space-y-6 animate-fade-in text-gray-100">
      {/* Encabezado Superior del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {currentTitle}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              UTC-5 Ecuador
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Auditoría integral, exactitud operativa y trazabilidad en tiempo real de Hospital del Computador.
          </p>
        </div>

        {/* Botones de Exportación */}
        <ReportExportActions
          canExport={canExport}
          isExportingExcel={isExportingExcel}
          isExportingPdf={isExportingPdf}
          onPreview={() => setIsPreviewOpen(true)}
          onExportExcel={() => handleExport('excel')}
          onExportPdf={() => handleExport('pdf')}
        />
      </div>

      {/* Barra de Filtros Combinables */}
      <ReportFilterBar
        filters={filters}
        filterOptions={filterOptions}
        dateRangeLabel={dateRangeLabel}
        isStandalone={standalone}
        onFilterChange={(newFilters) => {
          if (newFilters.reportType && newFilters.reportType !== filters.reportType) {
            setData([]);
            setKpis([]);
          }
          setFilters((prev) => ({ ...prev, ...newFilters }));
        }}
        onRefresh={loadReportData}
      />

      {/* Mensaje de Error si ocurre */}
      {errorMessage && (
        <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tarjetas KPI Reales */}
      <ReportKpiCards kpis={kpis} isLoading={isLoading} />

      {/* Nota de Transparencia de Inventario si existe */}
      {disclosure && (
        <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-200 flex items-center gap-2.5 shadow-sm">
          <InformationCircleIcon className="w-5 h-5 text-blue-400 shrink-0" />
          <span>{disclosure}</span>
        </div>
      )}

      {/* Tabla de Datos Paginada */}
      <ReportDataTable
        reportType={filters.reportType}
        tipoItem={filters.tipoItem}
        data={data}
        total={total}
        page={filters.page}
        limit={filters.limit}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {/* Análisis de Consumo del Período vs Stock Físico Actual */}
      {filters.reportType === 'inventory' && (
        <div className="bg-gray-800/80 border border-gray-700/70 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-700/60">
            <div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Movimientos y Rotación del Período ({dateRangeLabel})
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Los indicadores superiores reflejan el <span className="text-blue-300 font-semibold">Stock Actual Físico en Almacén</span>. A continuación se detallan los consumos autorizados en presupuestos aprobados del período seleccionado.
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-900 text-gray-300 border border-gray-700">
              Período Activo: {dateRangeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tarjeta 1: Repuestos Físicos Consumidos */}
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CubeIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-gray-200">
                    Repuestos Físicos Consumidos en Órdenes Aprobadas
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">Top 10</span>
              </div>
              {topConsumed.length > 0 ? (
                <div className="space-y-2">
                  {topConsumed.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-gray-800/60 border border-gray-700/40"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-gray-400 text-[11px]">{item.codigo}</span>
                        <span className="text-gray-200 font-medium truncate">{item.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-blue-300">{item.cantidadConsumida} uds.</span>
                        <span className="font-mono text-gray-300">$ {Number(item.montoTotal).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">
                  No se registraron repuestos físicos consumidos en el período seleccionado.
                </p>
              )}
            </div>

            {/* Tarjeta 2: Servicios Técnicos Ejecutados */}
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-gray-200">
                    Servicios Técnicos Ejecutados (Mano de Obra)
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">Top 10</span>
              </div>
              {topServices.length > 0 ? (
                <div className="space-y-2">
                  {topServices.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-gray-800/60 border border-gray-700/40"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-indigo-400 text-[11px]">{item.codigo}</span>
                        <span className="text-gray-200 font-medium truncate">{item.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-indigo-300">{item.cantidadRealizada} intervenciones</span>
                        <span className="font-mono text-emerald-400 font-semibold">$ {Number(item.montoTotal).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">
                  No se registraron servicios técnicos en presupuestos aprobados del período.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nota de Integridad y Transparencia Administrativa al pie */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-[11px] text-gray-500 flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-gray-400">Reglas de Integridad Contable y Operativa:</span>
          <p className="mt-0.5">
            Los valores de presupuestos aprobados representan compromisos cotizados con aceptación del cliente y no ingresos cobrados en caja.
            Las entregas físicas se computan exclusivamente mediante transiciones confirmadas al estado &quot;Entrega&quot; en el historial de trazabilidad.
            Los reingresos de equipos reflejan recurrencia de servicio técnico y no constituyen garantía legal sin confirmación pericial previa.
          </p>
        </div>
      </div>

      {/* Modal de Vista Previa A4 */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        reportType={filters.reportType}
        title={currentTitle}
        dateRangeLabel={dateRangeLabel}
        data={data}
        kpis={kpis}
        canExport={canExport}
        onClose={() => setIsPreviewOpen(false)}
        onExportExcel={() => handleExport('excel')}
        onExportPdf={() => handleExport('pdf')}
      />
    </div>
  );
}
