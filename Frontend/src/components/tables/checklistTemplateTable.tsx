'use client';

import React, { useState } from "react";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import { TrashIcon, PencilSquareIcon, DocumentTextIcon, Squares2X2Icon, TagIcon } from "@heroicons/react/24/outline";
import type { ChecklistTemplate } from "@/types/checklist.types";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

interface Props {
    onEdit: (template: ChecklistTemplate) => void;
}

export default function ChecklistTemplateTable({ onEdit }: Props) {
    const { 
        templates, 
        loading, 
        deleteTemplate,
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

    const handleConfirmDelete = (id: number, nombre: string) => {
        setConfirmDeleteId({ id, nombre });
    };

    const executeDelete = () => {
        if (confirmDeleteId) {
            deleteTemplate(confirmDeleteId.id);
            setConfirmDeleteId(null);
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
            header: "Puntos de Revisión",
            render: (template) => (
                <div className="flex flex-wrap gap-1.5 max-w-md">
                    {template.items.slice(0, 4).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 uppercase tracking-tighter">
                            {item}
                        </span>
                    ))}
                    {template.items.length > 4 && (
                        <span className="text-xs font-bold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded">
                            +{template.items.length - 4} más
                        </span>
                    )}
                </div>
            )
        }
    ];

    const rowActions = (template: ChecklistTemplate): ActionDef[] => {
        const actions: ActionDef[] = [];
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
        </>
    );
}
