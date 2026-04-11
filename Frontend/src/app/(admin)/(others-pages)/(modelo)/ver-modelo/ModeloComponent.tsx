'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ModeloTable from "@/components/tables/modeloTable";
import AgregarModeloModal from "@/components/modals/AgregarModeloModal";

export default function ModeloComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Modelos" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de modelos registrados</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Modelo
                            </Button>
                        </div>
                    }
                >
                    <ModeloTable key={tableRefreshKey} />
                </ComponentCard>

                <AgregarModeloModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}