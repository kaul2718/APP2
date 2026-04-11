'use client';

import { useRouter } from "next/navigation";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import OrdenTable from "@/components/tables/ordenTable";
import { Modal } from "@/components/ui/modal";
import IngresarOrdenForm from "@/components/form/ingresar-orden/IngresarOrdenForm";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";

export default function OrdenComponent() {
    const router = useRouter();
    const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = React.useState(false);
    const [createdOrderForEvidence, setCreatedOrderForEvidence] = React.useState<{ id: number; workOrderNumber: string } | null>(null);

    const handleOrderCreated = (order: { id: number; workOrderNumber: string }) => {
        setIsCreateOrderModalOpen(false);
        setCreatedOrderForEvidence(order);
        router.refresh();
    };

    return (
        <div>
            <PageBreadcrumb pageTitle="Ordenes" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de ordenes registradas</span>
                            <Button
                                onClick={() => setIsCreateOrderModalOpen(true)}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Orden
                            </Button>
                        </div>
                    }
                >
                    <OrdenTable />
                </ComponentCard>

                <Modal
                    isOpen={isCreateOrderModalOpen}
                    onClose={() => setIsCreateOrderModalOpen(false)}
                    title="Agregar orden"
                    className="max-w-5xl"
                >
                    <div className="p-4 sm:p-6">
                        <IngresarOrdenForm
                            onSuccess={handleOrderCreated}
                            onCancel={() => setIsCreateOrderModalOpen(false)}
                        />
                    </div>
                </Modal>

                <AgregarEvidenciaTecnicaModal
                    isOpen={Boolean(createdOrderForEvidence)}
                    onClose={() => setCreatedOrderForEvidence(null)}
                    orderId={createdOrderForEvidence?.id || 0}
                    onSuccess={() => {
                        // Sin accion adicional: la orden ya se creo y la tabla fue refrescada.
                    }}
                />
            </div>
        </div>
    );
}