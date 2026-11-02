'use client';

import React from 'react';
import {
  ReportType,
  DatePreset,
  ReportFilterState,
  ReportFilterOptions,
} from './types';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

interface ReportFilterBarProps {
  filters: ReportFilterState;
  filterOptions: ReportFilterOptions;
  dateRangeLabel: string;
  isStandalone?: boolean;
  onFilterChange: (newFilters: Partial<ReportFilterState>) => void;
  onRefresh: () => void;
}

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mes' },
  { id: 'last_month', label: 'Mes Anterior' },
  { id: 'year', label: 'Año Actual' },
  { id: 'all', label: 'Histórico' },
  { id: 'custom', label: 'Personalizado' },
];

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  filterOptions,
  dateRangeLabel,
  onFilterChange,
  onRefresh,
}) => {
  return (
    <div className="bg-gray-800/90 border border-gray-700/70 rounded-xl p-4 mb-6 shadow-sm">
      {/* 1. Barra de Selección de Períodos Rápidos */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs font-medium text-gray-400 mr-1">Período:</span>
          {PRESETS.map((p) => {
            const active = filters.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onFilterChange({ preset: p.id, page: 1 })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  active
                    ? 'bg-gray-700 text-blue-400 border border-blue-500/40 shadow-inner'
                    : 'bg-gray-900/60 text-gray-300 border border-gray-700/60 hover:bg-gray-750 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Etiqueta del período activo en hora Ecuador */}
        <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-900/40 px-3 py-1 rounded-md border border-gray-700/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Rango Activo:</span>
          <span className="font-semibold text-gray-200">{dateRangeLabel}</span>
        </div>
      </div>

      {/* Si eligió rango personalizado, mostrar selectores de fecha */}
      {filters.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-900/60 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Desde:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Hasta:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Selector de Clasificación para Inventario: Productos Físicos vs Servicios Técnicos */}
      {filters.reportType === 'inventory' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-2.5 bg-gray-900/60 rounded-xl border border-gray-700/60">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-400 mr-1">
              Clasificación:
            </span>
            <button
              type="button"
              onClick={() => onFilterChange({ tipoItem: 'productos', page: 1 })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                (!filters.tipoItem || filters.tipoItem === 'productos')
                  ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700'
              }`}
            >
              <CubeIcon className="w-4 h-4 text-blue-300" />
              <span>Productos Físicos (Almacén)</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ tipoItem: 'servicios', page: 1 })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filters.tipoItem === 'servicios'
                  ? 'bg-indigo-600 text-white shadow ring-1 ring-indigo-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700'
              }`}
            >
              <WrenchScrewdriverIcon className="w-4 h-4 text-indigo-300" />
              <span>Servicios Técnicos (Tarifario)</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ tipoItem: 'todos', page: 1 })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.tipoItem === 'todos'
                  ? 'bg-gray-700 text-white shadow ring-1 ring-gray-500'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white border border-gray-700'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4 text-gray-400" />
              <span>Todo el Catálogo</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-400 italic">
            {filters.tipoItem === 'servicios'
              ? 'Tarifas comerciales y mano de obra para presupuestos'
              : 'Existencias físicas reales, valoración y alertas de reposición'}
          </div>
        </div>
      )}

      {/* 3. Filtros Contextuales Combinables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
        {/* Búsqueda en vivo */}
        <div className="sm:col-span-2 relative">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              filters.reportType === 'inventory' && filters.tipoItem === 'servicios'
                ? 'Buscar servicio técnico por nombre o código...'
                : 'Buscar por N° orden, cliente, serie, código...'
            }
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
              title="Limpiar búsqueda"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Técnico (para órdenes, entregas, atrasadas, técnicos) */}
        {['orders', 'delivered', 'delayed'].includes(filters.reportType) && (
          <div>
            <select
              value={filters.tecnicoId}
              onChange={(e) => onFilterChange({ tecnicoId: e.target.value, page: 1 })}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los técnicos</option>
              {filterOptions.tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro por Estado de Orden */}
        {filters.reportType === 'orders' && (
          <div>
            <select
              value={filters.estadoId}
              onChange={(e) => onFilterChange({ estadoId: e.target.value, page: 1 })}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              {filterOptions.estados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro por Tipo de Orden (Express vs Completa) */}
        {['orders', 'delivered', 'delayed'].includes(filters.reportType) && (
          <div>
            <select
              value={filters.tipoOrden}
              onChange={(e) => onFilterChange({ tipoOrden: e.target.value, page: 1 })}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="todos">Express y Completas</option>
              <option value="EXPRESS">Solo Express</option>
              <option value="COMPLETA">Solo Completas</option>
            </select>
          </div>
        )}

        {/* Filtro por Estado de Presupuesto */}
        {filters.reportType === 'budgets' && (
          <div>
            <select
              value={filters.estadoId}
              onChange={(e) => onFilterChange({ estadoId: e.target.value, page: 1 })}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              {filterOptions.estadosPresupuesto.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro de Stock para Inventario */}
        {filters.reportType === 'inventory' && (
          <div>
            {filters.tipoItem === 'servicios' ? (
              <div className="w-full bg-gray-900/50 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-[11px] text-indigo-300 italic flex items-center gap-1.5">
                <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Mano de obra tarifada</span>
              </div>
            ) : (
              <select
                value={filters.filtroStock}
                onChange={(e) => onFilterChange({ filtroStock: e.target.value, page: 1 })}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="todos">Todos los niveles de stock</option>
                <option value="critico">Stock Crítico</option>
                <option value="agotado">Agotados (0)</option>
                <option value="disponible">Stock Disponible</option>
              </select>
            )}
          </div>
        )}

        {/* Botón Refrescar */}
        <div className="flex justify-end items-center">
          <button
            onClick={onRefresh}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-700/80 hover:bg-gray-700 border border-gray-600/70 text-xs font-medium text-gray-200 rounded-lg transition-colors"
            title="Refrescar datos con filtros actuales"
          >
            <ArrowPathIcon className="w-3.5 h-3.5 text-gray-300" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
