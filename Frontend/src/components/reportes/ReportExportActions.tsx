'use client';

import React from 'react';
import {
  EyeIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface ReportExportActionsProps {
  canExport: boolean;
  isExportingExcel: boolean;
  isExportingPdf: boolean;
  onPreview: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export const ReportExportActions: React.FC<ReportExportActionsProps> = ({
  canExport,
  isExportingExcel,
  isExportingPdf,
  onPreview,
  onExportExcel,
  onExportPdf,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Botón Vista Previa */}
      <button
        onClick={onPreview}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 rounded-lg text-xs font-medium transition-colors shadow-sm"
        title="Ver vista previa del documento antes de exportar"
      >
        <EyeIcon className="w-4 h-4 text-gray-300" />
        <span>Vista Previa</span>
      </button>

      {/* Botón Exportar Excel (.xlsx) */}
      <button
        onClick={onExportExcel}
        disabled={!canExport || isExportingExcel}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
          canExport && !isExportingExcel
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 active:scale-95'
            : 'bg-gray-800 text-gray-500 border border-gray-700/60 cursor-not-allowed'
        }`}
        title={
          canExport
            ? 'Descargar reporte completo en formato Microsoft Excel (.xlsx)'
            : 'No cuentas con el permiso "reportes.export" para descargar archivos'
        }
      >
        {isExportingExcel ? (
          <>
            <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Generando Excel...</span>
          </>
        ) : (
          <>
            <TableCellsIcon className="w-4 h-4 text-white" />
            <span>Exportar Excel (.xlsx)</span>
          </>
        )}
      </button>

      {/* Botón Exportar PDF */}
      <button
        onClick={onExportPdf}
        disabled={!canExport || isExportingPdf}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
          canExport && !isExportingPdf
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 active:scale-95'
            : 'bg-gray-800 text-gray-500 border border-gray-700/60 cursor-not-allowed'
        }`}
        title={
          canExport
            ? 'Descargar documento formal en formato PDF'
            : 'No cuentas con el permiso "reportes.export" para descargar archivos'
        }
      >
        {isExportingPdf ? (
          <>
            <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Generando PDF...</span>
          </>
        ) : (
          <>
            <DocumentArrowDownIcon className="w-4 h-4 text-white" />
            <span>Exportar PDF</span>
          </>
        )}
      </button>
    </div>
  );
};
