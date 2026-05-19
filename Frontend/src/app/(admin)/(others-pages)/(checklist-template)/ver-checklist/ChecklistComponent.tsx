'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ChecklistTemplateTable from "@/components/tables/checklistTemplateTable";
import AgregarChecklistTemplateModal from "@/components/modals/AgregarChecklistTemplateModal";
import EditarChecklistTemplateModal from "@/components/modals/EditarChecklistTemplateModal";
import { ChecklistTemplate } from "@/types/checklist.types";
import { usePermissions } from "@/hooks/usePermissions";

export default function ChecklistComponent() {
    const { hasPermission, loading } = usePermissions();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    const handleEdit = (template: ChecklistTemplate) => {
        setEditingTemplate(template);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (!hasPermission("checklists.view")) {
        return (
            <div className="p-10 text-center bg-white dark:bg-gray-900 rounded-lg border border-gray-150 dark:border-gray-800 shadow-theme-xs">
                <h2 className="text-lg font-bold text-red-500">Acceso Denegado</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No tienes los permisos asignados por el administrador para ver el módulo de Plantillas de Checklists. Por favor, contacta al administrador del sistema.
                </p>
            </div>
        );
    }

    return (
        <div>
            <PageBreadcrumb pageTitle="Configuración de Checklists" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Plantillas de peritaje técnico</span>
                            {hasPermission("checklists.manage") && (
                                <Button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-1"
                                    size="sm"
                                >
                                    <PlusCircleIcon className="w-4 h-4" />
                                    Agregar Plantilla
                                </Button>
                            )}
                        </div>
                    }
                >
                    <ChecklistTemplateTable 
                        key={tableRefreshKey} 
                        onEdit={handleEdit}
                    />
                </ComponentCard>

                <AgregarChecklistTemplateModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />

                <EditarChecklistTemplateModal
                    isOpen={!!editingTemplate}
                    template={editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}
