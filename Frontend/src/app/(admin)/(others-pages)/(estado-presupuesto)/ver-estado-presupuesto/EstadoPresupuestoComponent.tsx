'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import EstadoPresupuestoTable from "@/components/tables/estadoPresupuestoTable";
import AgregarEstadoPresupuestoModal from "@/components/modals/AgregarEstadoPresupuestoModal";

export default function EstadoPresupuestoComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Estados de Presupuesto" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de estados de presupuesto registrados</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Estado de Presupuesto
                            </Button>
                        </div>
                    }
                >
                    <EstadoPresupuestoTable key={tableRefreshKey} />
                </ComponentCard>

                <AgregarEstadoPresupuestoModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}