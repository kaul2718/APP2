'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { ChecklistTemplate, normalizeTemplateItems } from '@/types/checklist.types';
import {
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: ChecklistTemplate | null;
}

export default function VerChecklistTemplateModal({ isOpen, onClose, template }: Props) {
  if (!template) return null;

  const { fisica, funcional } = normalizeTemplateItems(template.items);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Plantilla: ${template.nombre}`}
      className="max-w-3xl"
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Encabezado con Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <TagIcon className="w-3.5 h-3.5" />
              <span>{template.tipoEquipo?.nombre || 'Tipo no asignado'}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">ID #{template.id}</span>
          </div>

          <div>
            {template.estado ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <XCircleIcon className="w-3.5 h-3.5" />
                Inactiva
              </span>
            )}
          </div>
        </div>

        {/* Columnas de Preguntas / Puntos de Peritaje */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Inspección Física */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <WrenchScrewdriverIcon className="w-4 h-4 text-amber-500" />
                <span>Inspección Física</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {fisica.length} puntos
              </span>
            </div>

            {fisica.length > 0 ? (
              <ul className="space-y-2 overflow-y-auto max-h-72 pr-1">
                {fisica.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-5">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">
                Sin puntos de inspección física
              </p>
            )}
          </div>

          {/* Inspección Funcional */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <CpuChipIcon className="w-4 h-4 text-blue-500" />
                <span>Inspección Funcional</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {funcional.length} puntos
              </span>
            </div>

            {funcional.length > 0 ? (
              <ul className="space-y-2 overflow-y-auto max-h-72 pr-1">
                {funcional.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-5">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">
                Sin puntos de inspección funcional
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

