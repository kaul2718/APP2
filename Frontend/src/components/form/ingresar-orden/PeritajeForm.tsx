'use client';

import React from "react";
import { ChecklistTemplate, ChecklistItemResult, FuncionalStatus, EsteticaStatus } from "@/types/checklist.types";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, BeakerIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";

interface Props {
    template: ChecklistTemplate;
    onChange: (results: ChecklistItemResult[]) => void;
    initialResults?: ChecklistItemResult[];
}

export default function PeritajeForm({ template, onChange, initialResults }: Props) {
    const [results, setResults] = React.useState<ChecklistItemResult[]>(
        initialResults || template.items.map(item => ({
            item,
            funcional: 'operativo',
            estetica: 'bueno',
            observaciones: ''
        }))
    );

    const updateResult = (index: number, field: keyof ChecklistItemResult, value: any) => {
        const newResults = [...results];
        newResults[index] = { ...newResults[index], [field]: value };
        setResults(newResults);
        onChange(newResults);
    };

    const functionalOptions: { value: FuncionalStatus; label: string; icon: any; activeClass: string; inactiveClass: string }[] = [
        { value: 'operativo', label: 'Operativo', icon: CheckCircleIcon, activeClass: 'text-green-500 bg-green-50 dark:bg-green-500/10 ring-green-500/30', inactiveClass: 'text-gray-300 dark:text-gray-600 hover:text-green-400' },
        { value: 'parcial', label: 'Parcial', icon: ExclamationTriangleIcon, activeClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-amber-500/30', inactiveClass: 'text-gray-300 dark:text-gray-600 hover:text-amber-400' },
        { value: 'no_operativo', label: 'No Operativo', icon: XCircleIcon, activeClass: 'text-red-500 bg-red-50 dark:bg-red-500/10 ring-red-500/30', inactiveClass: 'text-gray-300 dark:text-gray-600 hover:text-red-400' },
        { value: 'n/a', label: 'N/A', icon: BeakerIcon, activeClass: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-blue-500/30', inactiveClass: 'text-gray-300 dark:text-gray-600 hover:text-blue-400' },
    ];

    const aestheticOptions: { value: EsteticaStatus; label: string; color: string }[] = [
        { value: 'bueno', label: 'Bueno', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
        { value: 'regular', label: 'Regular', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
        { value: 'dañada', label: 'Dañada', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
        { value: 'n/a', label: 'N/A', color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400' },
    ];

    return (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <CheckCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Peritaje Técnico Inicial
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Evaluación de componentes para la plantilla: <span className="text-brand-500 dark:text-brand-400 font-semibold">{template.nombre}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-xs uppercase font-bold tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Componente</th>
                            <th className="px-6 py-4 text-center">Estado Funcional</th>
                            <th className="px-6 py-4 text-center">Estética</th>
                            <th className="px-6 py-4">Observaciones Técnicas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {results.map((res, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-all">
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-brand-500 transition-colors">
                                        {res.item}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center items-center gap-1">
                                        {functionalOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => updateResult(idx, 'funcional', opt.value)}
                                                className={`p-2 rounded-xl transition-all duration-200 ring-1 ring-transparent ${res.funcional === opt.value ? `ring-offset-2 dark:ring-offset-gray-900 ${opt.activeClass}` : opt.inactiveClass}`}
                                                title={opt.label}
                                                aria-label={`${opt.label} para ${res.item}`}
                                            >
                                                <opt.icon className="w-6 h-6" />
                                            </button>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <select
                                            value={res.estetica}
                                            onChange={(e) => updateResult(idx, 'estetica', e.target.value)}
                                            className={`text-xs font-extrabold rounded-full px-4 py-1.5 border-none focus:ring-0 cursor-pointer uppercase tracking-wider transition-all hover:scale-105 ${aestheticOptions.find(o => o.value === res.estetica)?.color}`}
                                            aria-label={`Estética para ${res.item}`}
                                        >
                                            {aestheticOptions.map(opt => (
                                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-normal uppercase">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative flex items-center group/input">
                                        <ChatBubbleBottomCenterTextIcon className="absolute left-0 w-4 h-4 text-gray-300 dark:text-gray-700 group-hover/input:text-brand-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={res.observaciones}
                                            onChange={(e) => updateResult(idx, 'observaciones', e.target.value)}
                                            placeholder="Añadir nota técnica..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-xs py-2 pl-6 placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-600 dark:text-gray-400"
                                            aria-label={`Observaciones para ${res.item}`}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    <span className="font-bold">Nota:</span> Los estados marcados aquí quedarán registrados como la condición inicial del equipo al momento de la recepción. Asegúrese de validar cada punto con el cliente presente.
                </p>
            </div>
        </div>
    );
}
