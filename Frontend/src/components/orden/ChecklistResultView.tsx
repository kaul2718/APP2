'use client';

import React from 'react';
import {
  ChecklistItemResult,
  ChecklistData,
  ChecklistDataV2,
  isChecklistV2,
  isChecklistV1,
} from '@/types/checklist.types';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  MinusCircleIcon,
  BoltIcon,
  ArrowUpCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/formatters';

interface Props {
  data: ChecklistData | ChecklistDataV2 | any;
}

export default function ChecklistResultView({ data }: Props) {
  if (!data) return null;

  // ==========================================
  // RENDERIZADO V2 (MODERNO, SEPARADO Y SEGURO)
  // ==========================================
  if (isChecklistV2(data)) {
    const rec = data.inspeccionRecepcion;
    const comp = data.inspeccionComplementaria;

    const renderBadgeEncendido = (val?: string) => {
      switch (val) {
        case 'correcto':
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              Enciende correctamente
            </span>
          );
        case 'falla':
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
              <XCircleIcon className="w-4 h-4 text-red-600" />
              No enciende / Falla en encendido
            </span>
          );
        case 'intermitente':
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <BoltIcon className="w-4 h-4 text-amber-600" />
              Encendido intermitente
            </span>
          );
        case 'no_probado':
        default:
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
              <QuestionMarkCircleIcon className="w-4 h-4 text-gray-500" />
              No probado al recibir
            </span>
          );
      }
    };

    const renderBadgeFisico = (val?: string) => {
      switch (val) {
        case 'bueno':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Buen estado</span>;
        case 'desgaste':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Rayones / Desgaste</span>;
        case 'danado':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Golpe / Fisura</span>;
        case 'roto':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Roto / Faltante</span>;
        case 'no_aplica':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">N/A</span>;
        case 'no_revisado':
        default:
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">No revisado</span>;
      }
    };

    const renderBadgeFuncional = (val?: string) => {
      switch (val) {
        case 'funciona':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Funciona</span>;
        case 'falla':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Falla</span>;
        case 'intermitente':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Intermitente</span>;
        case 'no_aplica':
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">N/A</span>;
        case 'no_probado':
        default:
          return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">No probado</span>;
      }
    };

    return (
      <div className="space-y-6">
        {/* BLOQUE 1: INSPECCIÓN INICIAL DE RECEPCIÓN */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500 rounded-xl text-white">
                <ClipboardDocumentCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Inspección Inicial de Recepción
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Condición constatada en mostrador al recibir el equipo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {renderBadgeEncendido(rec?.estadoEncendido)}
              {rec?.fecha && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDate(rec.fecha)}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Observación General si existe */}
            {rec?.observacionGeneral && (
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-700 dark:text-gray-300">
                <span className="font-bold text-gray-900 dark:text-white mr-1.5">Nota de recepción:</span>
                "{rec.observacionGeneral}"
              </div>
            )}

            {/* Inspección Física y Estética */}
            {rec?.fisica && rec.fisica.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Puntos de Inspección Física y Estética ({rec.fisica.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rec.fisica.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {f.item}
                        </p>
                        {f.observaciones && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {f.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {renderBadgeFisico(f.estado)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verificación Funcional Rápida */}
            {rec?.funcional && rec.funcional.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Verificación Funcional en Mostrador ({rec.funcional.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rec.funcional.map((fn, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {fn.item}
                        </p>
                        {fn.observaciones && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {fn.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {renderBadgeFuncional(fn.estado)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE 2: INSPECCIÓN COMPLEMENTARIA POR ESCALAMIENTO */}
        {comp && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <ArrowUpCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Inspección Complementaria por Escalamiento
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-600 text-white">
                      Orden Completa
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Registrada al escalar la orden en taller tras detectar fallas complejas
                  </p>
                </div>
              </div>

              {comp.fecha && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDate(comp.fecha)}
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Motivo de escalamiento y responsable */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-1">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    Motivo Técnico del Escalamiento:
                  </span>
                  {comp.responsableNombre && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      Responsable: {comp.responsableNombre}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 italic">
                  "{comp.motivoEscalamiento}"
                </p>
              </div>

              {/* Estado de Autorización del Cliente */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className={`w-5 h-5 ${comp.autorizacionCliente?.autorizado ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Autorización del Cliente:
                  </span>
                </div>
                <div>
                  {comp.autorizacionCliente?.autorizado ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300">
                      ✓ Autorizado vía {comp.autorizacionCliente.medio || 'Directo'}
                      {comp.autorizacionCliente.detalles ? ` (${comp.autorizacionCliente.detalles})` : ''}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300">
                      ⚠️ Pendiente de Autorización del Cliente
                    </span>
                  )}
                </div>
              </div>

              {/* Puntos Físicos Complementarios */}
              {comp.fisica && comp.fisica.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Inspección Física Complementaria ({comp.fisica.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {comp.fisica.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{f.item}</p>
                          {f.observaciones && <p className="text-[11px] text-gray-500 truncate">{f.observaciones}</p>}
                        </div>
                        {renderBadgeFisico(f.estado)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pruebas Funcionales Complementarias */}
              {comp.funcional && comp.funcional.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Pruebas Funcionales en Taller ({comp.funcional.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {comp.funcional.map((fn, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{fn.item}</p>
                          {fn.observaciones && <p className="text-[11px] text-gray-500 truncate">{fn.observaciones}</p>}
                        </div>
                        {renderBadgeFuncional(fn.estado)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDERIZADO V1 (LEGADO - PRESERVACIÓN FIEL)
  // ==========================================
  if (isChecklistV1(data)) {
    const getFuncionalIcon = (status: string) => {
      switch (status) {
        case 'operativo':
          return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'parcial':
          return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
        case 'no_operativo':
          return <XCircleIcon className="w-5 h-5 text-red-500" />;
        default:
          return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      }
    };

    const getEsteticaIcon = (status: string) => {
      switch (status) {
        case 'bueno':
          return <div className="w-3 h-3 rounded-full bg-green-500" />;
        case 'regular':
          return <div className="w-3 h-3 rounded-full bg-amber-500" />;
        case 'dañada':
          return <div className="w-3 h-3 rounded-full bg-red-500" />;
        default:
          return <div className="w-3 h-3 rounded-full bg-gray-300" />;
      }
    };

    const formatStatus = (s: string) => s.replace('_', ' ').toUpperCase();

    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500 rounded-lg text-white">
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Inspección Inicial de Recepción (Histórico V1)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Datos originales registrados al momento de la recepción
              </p>
            </div>
          </div>
          {data.fechaPeritaje && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
              <CalendarIcon className="w-3 h-3" aria-hidden="true" />
              {formatDate(data.fechaPeritaje)}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold border-b border-gray-50 dark:border-gray-800">
                <th className="px-6 py-3">Componente / Punto</th>
                <th className="px-6 py-3">Funcionamiento</th>
                <th className="px-6 py-3">Estética / Físico</th>
                <th className="px-6 py-3">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.results.map((result: ChecklistItemResult, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {result.item}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getFuncionalIcon(result.funcional)}
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {formatStatus(result.funcional)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getEsteticaIcon(result.estetica)}
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {formatStatus(result.estetica)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 italic">
                    {result.observaciones || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
