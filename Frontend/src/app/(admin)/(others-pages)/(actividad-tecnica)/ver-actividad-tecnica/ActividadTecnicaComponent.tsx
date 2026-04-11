'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ActividadTecnicaTable from "@/components/tables/actividadTecnicaTable";
import AgregarActividadTecnicaRegistroModal from "@/components/modals/AgregarActividadTecnicaRegistroModal";

export default function ActividadTecnicaComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Actividades Técnicas" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de actividades técnicas registradas</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Actividad Técnica
                            </Button>
                        </div>
                    }
                >
                    <ActividadTecnicaTable key={tableRefreshKey} />
                </ComponentCard>

                <AgregarActividadTecnicaRegistroModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}