'use client';

import React, { useState } from "react";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import {
    TrashIcon,
    PencilSquareIcon,
    EyeIcon,
    DocumentTextIcon,
    TagIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";
import { ChecklistTemplate, normalizeTemplateItems } from "@/types/checklist.types";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import VerChecklistTemplateModal from "@/components/modals/VerChecklistTemplateModal";
import { usePermissions } from "@/hooks/usePermissions";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

interface Props {
    onEdit: (template: ChecklistTemplate) => void;
    onRefreshStats?: () => void;
}

export default function ChecklistTemplateTable({ onEdit, onRefreshStats }: Props) {
    const { 
        templates, 
        loading, 
        deleteTemplate,
        toggleTemplateStatus,
        totalPages,
        totalItems,
        currentPage,
        showInactive,
        searchTerm,
        setSearchTerm,
        setShowInactive,
        fetchTemplates
    } = useChecklistTemplate();
    const { hasPermission } = usePermissions();
    const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: number, nombre: string } | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<ChecklistTemplate | null>(null);

    const handleConfirmDelete = (id: number, nombre: string) => {
        setConfirmDeleteId({ id, nombre });
    };

    const executeDelete = async () => {
        if (confirmDeleteId) {
            const ok = await deleteTemplate(confirmDeleteId.id);
            setConfirmDeleteId(null);
            if (ok && onRefreshStats) {
                onRefreshStats();
            }
        }
    };

    const handleToggleStatus = async (template: ChecklistTemplate) => {
        await toggleTemplateStatus(template.id);
        if (onRefreshStats) {
            onRefreshStats();
        }
    };

    const canManage = hasPermission("checklists.manage");

    const columns: ColumnDef<ChecklistTemplate>[] = [
        {
            key: "nombre",
            header: "Plantilla",
            render: (template) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                            {template.nombre}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">ID: #{template.id}</p>
                    </div>
                </div>
            )
        },
        {
            key: "tipoEquipo",
            header: "Tipo de Equipo",
            render: (template) => (
                <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {template.tipoEquipo?.nombre || "Sin tipo"}
                    </span>
                </div>
            )
        },
        {
            key: "items",
            header: "Puntos de Peritaje",
            render: (template) => {
                const { fisica, funcional } = normalizeTemplateItems(template.items);
                const total = fisica.length + funcional.length;

                return (
                    <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                                {fisica.length} físicas
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                                {funcional.length} funcionales
                            </span>
                            <span className="text-gray-400 font-mono text-[11px]">
                                ({total} en total)
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {[...fisica, ...funcional].slice(0, 3).map((item, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 truncate max-w-[140px]"
                                    title={item}
                                >
                                    {item}
                                </span>
                            ))}
                            {total > 3 && (
                                <span className="text-[11px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded">
                                    +{total - 3} más
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: "estado",
            header: "Estado",
            render: (template) => (
                <div>
                    {template.estado ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Activa
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Inactiva
                        </span>
                    )}
                </div>
            )
        }
    ];

    const rowActions = (template: ChecklistTemplate): ActionDef[] => {
        const actions: ActionDef[] = [
            {
                key: "view",
                label: <EyeIcon className="h-4 w-4" />,
                text: "Ver detalles de plantilla",
                onClick: () => setViewingTemplate(template),
                className: "flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            }
        ];

        if (canManage) {
            actions.push(
                {
                    key: "edit",
                    label: <PencilSquareIcon className="h-4 w-4" />,
                    text: "Editar plantilla",
                    onClick: () => onEdit(template),
                    className: "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors"
                },
                {
                    key: "toggle",
                    label: <ArrowPathRoundedSquareIcon className="h-4 w-4" />,
                    text: template.estado ? "Desactivar plantilla" : "Activar plantilla",
                    onClick: () => handleToggleStatus(template),
                    className: `flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        template.estado
                            ? "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                    }`
                },
                {
                    key: "delete",
                    label: <TrashIcon className="h-4 w-4" />,
                    text: "Eliminar plantilla",
                    onClick: () => handleConfirmDelete(template.id, template.nombre),
                    className: "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                }
            );
        }
        return actions;
    };

    return (
        <>
            <DataTable
                caption="Tabla de plantillas de checklist registradas"
                data={templates}
                columns={columns}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={(term) => {
                    setSearchTerm(term);
                    fetchTemplates(1, 10, term, showInactive);
                }}
                showInactive={showInactive}
                onToggleInactive={() => {
                    const nextValue = !showInactive;
                    setShowInactive(nextValue);
                    fetchTemplates(1, 10, searchTerm, nextValue);
                }}
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchTemplates(page, 10, searchTerm, showInactive)}
                actions={rowActions}
                getRowKey={(t) => t.id}
            />

            {/* Modal de Visualización Previa */}
            <VerChecklistTemplateModal
                isOpen={!!viewingTemplate}
                template={viewingTemplate}
                onClose={() => setViewingTemplate(null)}
            />

            {/* Modal de Confirmación de Eliminación */}
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
        </>
    );
}
