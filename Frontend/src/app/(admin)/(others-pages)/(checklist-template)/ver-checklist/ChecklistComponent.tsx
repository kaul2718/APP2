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

export default function ChecklistComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    const handleEdit = (template: ChecklistTemplate) => {
        setEditingTemplate(template);
    };

    return (
        <div>
            <PageBreadcrumb pageTitle="Configuración de Checklists" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Plantillas de peritaje técnico</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Plantilla
                            </Button>
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
