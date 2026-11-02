'use client';

import React from 'react';
import { ReportType } from './types';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ReportDataTableProps {
  reportType: ReportType;
  tipoItem?: 'productos' | 'servicios' | 'todos';
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export const ReportDataTable: React.FC<ReportDataTableProps> = ({
  reportType,
  tipoItem,
  data,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  onPageChange,
  onLimitChange,
}) => {
  if (isLoading) {
    return (
      <div className="bg-gray-800/90 border border-gray-700/70 rounded-xl p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-3">
          <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-200">Consultando registros en base de datos...</p>
        <p className="text-xs text-gray-400 mt-1">Calculando métricas agregadas y tiempos de ciclo</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800/90 border border-gray-700/70 rounded-xl p-10 text-center shadow-sm">
        <div className="inline-flex items-center justify-center p-3 bg-gray-700/40 rounded-full mb-3 text-gray-400">
          <DocumentMagnifyingGlassIcon className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-semibold text-gray-200">No se encontraron registros</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No existen movimientos u órdenes que coincidan con los filtros y período seleccionados.
        </p>
      </div>
    );
  }

  const renderBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('entreg') || s.includes('aprob') || s.includes('complet')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{status}</span>;
    }
    if (s.includes('rechaz') || s.includes('cancel') || s.includes('atras') || s.includes('agotad')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">{status}</span>;
    }
    if (s.includes('critic') || s.includes('pend') || s.includes('espera')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">{status}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">{status}</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (val: any): string => {
    if (val === null || val === undefined || val === '') return '$ 0.00';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '$ 0.00';
    return `$ ${num.toFixed(2)}`;
  };

  const formatNumber = (val: any, fallback = '0'): string => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (isNaN(num)) return fallback;
    return String(num);
  };

  return (
    <div className="bg-gray-800/90 border border-gray-700/70 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 border-b border-gray-700 text-[11px] font-semibold uppercase tracking-wider">
              {reportType === 'orders' && (
                <>
                  <th className="py-3 px-3">N° Orden</th>
                  <th className="py-3 px-2 text-center">Tipo</th>
                  <th className="py-3 px-3">Fecha Ingreso</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Equipo</th>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                  <th className="py-3 px-3 text-right">Presup. Aprobado</th>
                </>
              )}

              {reportType === 'delivered' && (
                <>
                  <th className="py-3 px-3">N° Orden</th>
                  <th className="py-3 px-2 text-center">Tipo</th>
                  <th className="py-3 px-3">Fecha Ingreso</th>
                  <th className="py-3 px-2 text-center">Estado Actual</th>
                  <th className="py-3 px-3">Entrega Física</th>
                  <th className="py-3 px-3 text-right">Días en Taller</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Equipo</th>
                  <th className="py-3 px-3">Técnico</th>
                </>
              )}

              {reportType === 'delayed' && (
                <>
                  <th className="py-3 px-3">N° Orden</th>
                  <th className="py-3 px-2 text-center">Tipo</th>
                  <th className="py-3 px-3">Fecha Ingreso</th>
                  <th className="py-3 px-3">Fecha Prometida</th>
                  <th className="py-3 px-3 text-right text-red-400">Días Retraso</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Equipo</th>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                </>
              )}

              {reportType === 'budgets' && (
                <>
                  <th className="py-3 px-3">N° Presupuesto</th>
                  <th className="py-3 px-3">N° Orden</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                  <th className="py-3 px-3 text-right">Repuestos</th>
                  <th className="py-3 px-3 text-right">Mano de Obra</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </>
              )}

              {reportType === 'inventory' && (
                <>
                  {tipoItem === 'servicios' ? (
                    <>
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Servicio Técnico (Mano de Obra)</th>
                      <th className="py-3 px-3">Categoría</th>
                      <th className="py-3 px-3 text-right">Tarifa Comercial (PVP)</th>
                      <th className="py-3 px-3 text-right">Costo Referencial</th>
                      <th className="py-3 px-2 text-center">Disponibilidad</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Descripción</th>
                      <th className="py-3 px-3">Categoría</th>
                      <th className="py-3 px-3 text-right">Stock Almacén</th>
                      <th className="py-3 px-3 text-right">Mín.</th>
                      <th className="py-3 px-2 text-center">Condición</th>
                      <th className="py-3 px-3 text-right">Costo Unit.</th>
                      <th className="py-3 px-3 text-right">P. Venta</th>
                      <th className="py-3 px-3 text-right">Valor Costo</th>
                    </>
                  )}
                </>
              )}

              {reportType === 'techs' && (
                <>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-3">Correo</th>
                  <th className="py-3 px-3 text-right">En Taller Activo</th>
                  <th className="py-3 px-3 text-right">Completadas Período</th>
                  <th className="py-3 px-3 text-right">Intervenciones</th>
                  <th className="py-3 px-3 text-right">Retrasadas</th>
                </>
              )}

              {reportType === 'clients' && (
                <>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Cédula / RUC</th>
                  <th className="py-3 px-3">Teléfono</th>
                  <th className="py-3 px-3 text-right">Servicios Históricos</th>
                  <th className="py-3 px-3">Última Visita</th>
                </>
              )}

              {reportType === 'purchases' && (
                <>
                  <th className="py-3 px-3">N° Factura</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Proveedor</th>
                  <th className="py-3 px-3">RUC Proveedor</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">IVA</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-750/50 transition-colors">
                {reportType === 'orders' && (
                  <>
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-400">{row.workOrderNumber}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.tipoOrden === 'EXPRESS' ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-700 text-gray-300'}`}>
                        {row.tipoOrden}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(row.fechaIngreso)}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{row.cliente}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.equipoCompleto}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.tecnico}</td>
                    <td className="py-2.5 px-2 text-center">{renderBadge(row.estado)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                      {row.montoAprobado ? formatMoney(row.montoAprobado) : '-'}
                    </td>
                  </>
                )}

                {reportType === 'delivered' && (
                  <>
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-400">{row.workOrderNumber}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-700 text-gray-300">{row.tipoOrden}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(row.fechaIngreso)}</td>
                    <td className="py-2.5 px-2 text-center">{renderBadge(row.estado)}</td>
                    <td className="py-2.5 px-3">
                      {row.fechaEntrega ? (
                        <span className="text-emerald-400 font-medium">{formatDate(row.fechaEntrega)}</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">En Taller</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-200">{formatNumber(row.diasEstanciaTaller)} días</td>
                    <td className="py-2.5 px-3 font-medium text-white">{row.cliente}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.equipo}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.tecnico}</td>
                  </>
                )}

                {reportType === 'delayed' && (
                  <>
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-400">{row.workOrderNumber}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-700 text-gray-300">{row.tipoOrden}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(row.fechaIngreso)}</td>
                    <td className="py-2.5 px-3 text-red-300">{formatDate(row.fechaPrometidaEntrega)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">+{formatNumber(row.diasRetraso)} d</td>
                    <td className="py-2.5 px-3 font-medium text-white">{row.cliente}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.equipo}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.tecnico}</td>
                    <td className="py-2.5 px-2 text-center">{renderBadge(row.estado)}</td>
                  </>
                )}

                {reportType === 'budgets' && (
                  <>
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-400">{row.numeroPresupuesto}</td>
                    <td className="py-2.5 px-3 text-gray-400">{row.workOrderNumber}</td>
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(row.fechaEmision)}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{row.cliente}</td>
                    <td className="py-2.5 px-2 text-center">{renderBadge(row.estado)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatMoney(row.montoRepuestos)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatMoney(row.montoServicios)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatMoney(row.subtotal)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{formatMoney(row.total)}</td>
                  </>
                )}

                {reportType === 'inventory' && (
                  <>
                    {tipoItem === 'servicios' || row.esServicio ? (
                      <>
                        <td className="py-2.5 px-3 font-mono text-indigo-400">{row.codigo}</td>
                        <td className="py-2.5 px-3 font-medium text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{row.nombre}</span>
                            {tipoItem === 'todos' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Servicio
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{row.categoria}</td>
                        {tipoItem === 'servicios' ? (
                          <>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              {formatMoney(row.precioVenta)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-400">
                              {Number(row.costoUnitario) > 0 ? (
                                formatMoney(row.costoUnitario)
                              ) : (
                                <span className="text-gray-500 italic text-xs">Sin costo reg.</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Tarifa Activa
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-500 italic text-xs">
                              N/A
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-500 italic text-xs">
                              -
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                                Tarifa Activa
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-400">
                              {Number(row.costoUnitario) > 0 ? (
                                formatMoney(row.costoUnitario)
                              ) : (
                                <span className="text-gray-500 italic text-xs">Sin costo reg.</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                              {formatMoney(row.precioVenta)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-500 text-xs">
                              -
                            </td>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3 font-mono text-gray-400">{row.codigo}</td>
                        <td className="py-2.5 px-3 font-medium text-white">{row.nombre}</td>
                        <td className="py-2.5 px-3 text-gray-400">{row.categoria}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          <span className={Number(row.stock) > 0 ? 'text-white' : 'text-gray-500'}>
                            {row.stock ?? 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-400">{row.stockMinimo ?? 0}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadge(row.estadoStock)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                          {Number(row.costoUnitario) === 0 && !row.tieneCostoRegistrado ? (
                            <span
                              className="inline-flex items-center gap-1 text-gray-400"
                              title="Producto físico con stock pero sin costo unitario registrado"
                            >
                              $ 0.00 <span className="text-[10px] text-amber-400/90 font-sans italic">(Sin reg.)</span>
                            </span>
                          ) : (
                            formatMoney(row.costoUnitario)
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatMoney(row.precioVenta)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-400">
                          {formatMoney(row.valorInventarioCosto)}
                        </td>
                      </>
                    )}
                  </>
                )}

                {reportType === 'techs' && (
                  <>
                    <td className="py-2.5 px-3 font-medium text-white">{row.nombre}</td>
                    <td className="py-2.5 px-3 text-gray-400">{row.email}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">{formatNumber(row.cargaActivaTaller)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{formatNumber(row.completadasPeriodo)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatNumber(row.actividadesRegistradas)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">{formatNumber(row.ordenesAtrasadas)}</td>
                  </>
                )}

                {reportType === 'clients' && (
                  <>
                    <td className="py-2.5 px-3 font-medium text-white">{row.nombre}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{row.identificacion}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.telefono}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">{formatNumber(row.totalOrdenes)} órdenes</td>
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(row.ultimoIngreso)}</td>
                  </>
                )}

                {reportType === 'purchases' && (
                  <>
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-400">{row.numeroFactura}</td>
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(row.fecha)}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{row.proveedor}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{row.proveedorRuc}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatMoney(row.subtotal)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{formatMoney(row.ivaMonto)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{formatMoney(row.total)}</td>
                    <td className="py-2.5 px-2 text-center">{renderBadge(row.estado)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-900/60 border-t border-gray-700/60 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>Mostrando {Math.min(data.length, limit)} de {total} registros</span>
          <span className="text-gray-600">|</span>
          <label className="flex items-center gap-1.5">
            <span>Filas:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750"
          >
            Anterior
          </button>
          <span className="px-2 font-medium text-gray-200">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};
