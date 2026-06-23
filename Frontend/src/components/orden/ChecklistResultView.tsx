'use client';

import React from 'react';
import { ChecklistItemResult, ChecklistData } from '@/types/checklist.types';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    XCircleIcon, 
    ClipboardDocumentCheckIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/formatters';

interface Props {
    data: ChecklistData;
}

export default function ChecklistResultView({ data }: Props) {
    if (!data?.results || data.results.length === 0) return null;

    const getFuncionalIcon = (status: string) => {
        switch (status) {
            case 'operativo': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'parcial': return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
            case 'no_operativo': return <XCircleIcon className="w-5 h-5 text-red-500" />;
            default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
        }
    };

    const getEsteticaIcon = (status: string) => {
        switch (status) {
            case 'bueno': return <div className="w-3 h-3 rounded-full bg-green-500" />;
            case 'regular': return <div className="w-3 h-3 rounded-full bg-amber-500" />;
            case 'dañada': return <div className="w-3 h-3 rounded-full bg-red-500" />;
            default: return <div className="w-3 h-3 rounded-full bg-gray-300" />;
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
                        <h3 className="font-bold text-gray-900 dark:text-white">Peritaje Técnico Inicial</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">Estado del equipo al momento de la recepción</p>
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
                        {data.results.map((result, idx) => (
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
