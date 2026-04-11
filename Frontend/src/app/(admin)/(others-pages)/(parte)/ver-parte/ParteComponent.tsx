'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ParteTable from "@/components/tables/parteTable";
import AgregarParteModal from "@/components/modals/AgregarParteModal";

export default function ParteComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Catálogo de Ítems" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Catálogo de ítems registrados</span>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Ítem
                            </Button>
                        </div>
                    }
                >
                    <ParteTable key={tableRefreshKey} />
                </ComponentCard>

                <AgregarParteModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}