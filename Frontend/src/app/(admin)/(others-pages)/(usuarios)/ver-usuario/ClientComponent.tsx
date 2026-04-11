'use client';

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import UsuarioNuevoTable from "@/components/tables/usuarioNuevoTable";
import UsuarioCreateModal from "@/components/modals/UsuarioCreateModal";

export default function ClientComponent() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    return (
        <div>
            <PageBreadcrumb pageTitle="Usuarios" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de usuarios</span>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Usuario
                            </Button>
                        </div>
                    }
                >
                    <UsuarioNuevoTable key={tableRefreshKey} />
                </ComponentCard>

                <UsuarioCreateModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={() => setTableRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}