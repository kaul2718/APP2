'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import TipoActividadTecnicaTable from "@/components/tables/tipoActividadTecnicaTable";
import AgregarTipoActividadTecnicaModal from "@/components/modals/AgregarTipoActividadTecnicaModal";

export default function TipoActividadTecnicaComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Tipos de Actividad Técnica" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de tipos de actividad técnica registradas</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Tipo de Actividad Técnica
                            </Button>
                        </div>
                    }
                >
                    <TipoActividadTecnicaTable key={tableRefreshKey} />
                </ComponentCard>

                <AgregarTipoActividadTecnicaModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}