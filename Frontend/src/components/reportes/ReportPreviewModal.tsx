'use client';

import React, { useEffect } from 'react';
import { ReportType } from './types';
import {
  EyeIcon,
  XMarkIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface ReportPreviewModalProps {
  isOpen: boolean;
  reportType: ReportType;
  title: string;
  dateRangeLabel: string;
  data: any[];
  kpis: { label: string; value: string | number }[];
  canExport: boolean;
  onClose: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  reportType,
  title,
  dateRangeLabel,
  data,
  kpis,
  canExport,
  onClose,
  onExportExcel,
  onExportPdf,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-preview-title"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Barra Superior Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/90">
          <div className="flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-blue-400" />
            <h3 id="modal-preview-title" className="text-base font-bold text-white">
              Vista Previa de Exportación Oficial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Hoja de Documento Simulada */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-950/60">
          <div className="bg-white text-gray-900 rounded-xl p-8 shadow-xl max-w-3xl mx-auto border border-gray-200">
            {/* Membrete Oficial */}
            <div className="flex items-start justify-between border-b pb-4 border-gray-300">
              <div>
                <h1 className="text-lg font-black tracking-tight text-blue-900">
                  HOSPITAL DEL COMPUTADOR
                </h1>
                <p className="text-xs text-gray-600 font-medium">Servicio Técnico Especializado e Informática</p>
                <p className="text-[11px] text-gray-500">RUC: 1792999999001 | Telf: +593 96 962 0222</p>
                <p className="text-[11px] text-gray-500">Riobamba, Chimborazo, Ecuador</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded uppercase">
                  Documento Administrativo
                </span>
                <p className="text-[10px] text-gray-500 mt-1">Hora Ecuador (UTC-5)</p>
              </div>
            </div>

            {/* Título del Reporte y Metadatos */}
            <div className="my-4">
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                {title}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                <span className="font-semibold">Período consultado:</span> {dateRangeLabel}
              </p>
              <p className="text-[10px] text-gray-400 italic mt-0.5">
                Generado para propósitos de gestión, auditoría interna y toma de decisiones operativas.
              </p>
            </div>

            {/* Franja de KPIs clave */}
            {kpis && kpis.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
                {kpis.slice(0, 4).map((k, i) => (
                  <div key={i} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                      {k.label}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-blue-900 font-mono mt-0.5">
                      {k.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Muestra de la tabla (Primeros 8 registros) */}
            <div className="border border-gray-200 rounded overflow-hidden mt-4">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-blue-900 text-white font-semibold">
                  <tr>
                    <th className="py-2 px-2">Identificador</th>
                    <th className="py-2 px-2">Detalle Principal</th>
                    <th className="py-2 px-2">Referencia / Responsable</th>
                    <th className="py-2 px-2 text-right">Estado / Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {data.slice(0, 8).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-1.5 px-2 font-mono font-medium text-blue-900">
                        {row.workOrderNumber || row.numeroPresupuesto || row.codigo || row.numeroFactura || row.nombre || '-'}
                      </td>
                      <td className="py-1.5 px-2">
                        {row.cliente || row.nombre || row.equipo || row.proveedor || '-'}
                      </td>
                      <td className="py-1.5 px-2 text-gray-600">
                        {row.tecnico || row.tipoEquipo || row.categoria || row.serie || '-'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium">
                        {(() => {
                          const val = row.montoAprobado ?? row.total;
                          if (val !== undefined && val !== null && val !== '') {
                            const num = typeof val === 'number' ? val : parseFloat(val);
                            if (!isNaN(num)) return `$ ${num.toFixed(2)}`;
                          }
                          return row.estado || row.estadoStock || row.diasEstanciaTaller || '-';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              Mostrando vista previa resumida ({Math.min(data.length, 8)} de {data.length} registros cargados).
              La exportación definitiva incluirá el 100% de registros autorizados.
            </p>
          </div>
        </div>

        {/* Pie de Acciones del Modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-800 bg-gray-900">
          <p className="text-xs text-gray-400">
            ¿Confirmas la generación formal del documento?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onExportExcel();
              }}
              disabled={!canExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <TableCellsIcon className="w-4 h-4 text-white" />
              <span>Descargar Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onExportPdf();
              }}
              disabled={!canExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <DocumentArrowDownIcon className="w-4 h-4 text-white" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
