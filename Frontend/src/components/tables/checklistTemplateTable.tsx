'use client';

import React from "react";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import { TrashIcon, PencilSquareIcon, DocumentTextIcon, Squares2X2Icon, TagIcon } from "@heroicons/react/24/outline";
import type { ChecklistTemplate } from "@/types/checklist.types";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";

interface Props {
    onEdit: (template: ChecklistTemplate) => void;
}

export default function ChecklistTemplateTable({ onEdit }: Props) {
    const { templates, loading, deleteTemplate } = useChecklistTemplate();
    const { hasPermission } = usePermissions();
    const [confirmDeleteId, setConfirmDeleteId] = React.useState<{ id: number, nombre: string } | null>(null);

    const handleConfirmDelete = (id: number, nombre: string) => {
        setConfirmDeleteId({ id, nombre });
    };

    const executeDelete = () => {
        if (confirmDeleteId) {
            deleteTemplate(confirmDeleteId.id);
            setConfirmDeleteId(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">Cargando plantillas de peritaje...</p>
        </div>
    );

    const canManage = hasPermission("checklists.manage");

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Plantilla</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo de Equipo</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Puntos de Revisión</th>
                        {canManage && (
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
                                        <DocumentTextIcon className="w-5 h-5 text-brand-500" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
                                        {template.nombre}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <TagIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {template.tipoEquipo?.nombre || "Sin tipo"}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5 max-w-md">
                                    {template.items.slice(0, 4).map((item, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 uppercase tracking-tighter">
                                            {item}
                                        </span>
                                    ))}
                                    {template.items.length > 4 && (
                                        <span className="text-[10px] font-bold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded">
                                            +{template.items.length - 4} más
                                        </span>
                                    )}
                                </div>
                            </td>
                            {canManage && (
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-2 transition-opacity">
                                        <button
                                            onClick={() => onEdit(template)}
                                            className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-all"
                                            title="Editar plantilla"
                                        >
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleConfirmDelete(template.id, template.nombre)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Eliminar plantilla"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {templates.length === 0 && (
                        <tr>
                            <td colSpan={canManage ? 4 : 3} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <Squares2X2Icon className="w-12 h-12 text-gray-200 dark:text-gray-700" />
                                    <p className="text-sm text-gray-500">No hay plantillas registradas aún.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Modal de Confirmación */}
            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                title="Eliminar Plantilla"
                description={`¿Estás seguro de que deseas eliminar la plantilla "${confirmDeleteId?.nombre}"? Esta acción no se puede deshacer.`}
                onConfirm={executeDelete}
                onClose={() => setConfirmDeleteId(null)}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                destructive={true}
            />
        </div>
    );
}
