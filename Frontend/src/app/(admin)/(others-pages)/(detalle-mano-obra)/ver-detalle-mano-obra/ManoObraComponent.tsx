'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import DetalleManoObraTable from "@/components/tables/detalleManoObraTable";
import AgregarDetalleManoObraModal from "@/components/modals/AgregarDetalleManoObraModal";

export default function DetalleManoObraComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Detalle Mano de Obra" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de detalles de mano de obra registrados</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Detalle de Mano de Obra
                            </Button>
                        </div>
                    }
                >
                    <DetalleManoObraTable key={tableRefreshKey} />
                </ComponentCard>

                <AgregarDetalleManoObraModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}