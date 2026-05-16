'use client';

import { useRouter } from "next/navigation";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import OrdenListLayout from "@/components/ordenes/OrdenListLayout";
import { Modal } from "@/components/ui/modal";
import IngresarOrdenForm from "@/components/form/ingresar-orden/IngresarOrdenForm";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import GenerarPdfIngresoModal from "@/components/modals/GenerarPdfIngresoModal";

export default function OrdenComponent() {
    const router = useRouter();
    const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = React.useState(false);
    const [createdOrderForEvidence, setCreatedOrderForEvidence] = React.useState<{ id: number; workOrderNumber: string } | null>(null);
    const [orderToPrint, setOrderToPrint] = React.useState<any | null>(null);
    const [showPrintConfirm, setShowPrintConfirm] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);

    const handleOrderCreated = (order: { id: number; workOrderNumber: string }) => {
        setIsCreateOrderModalOpen(false);
        setCreatedOrderForEvidence(order);
        setRefreshKey(prev => prev + 1); // Forzar el remount de la lista de órdenes
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
                    <OrdenListLayout key={refreshKey} />
                </ComponentCard>

                <Modal
                    isOpen={isCreateOrderModalOpen}
                    onClose={() => setIsCreateOrderModalOpen(false)}
                    title="Agregar orden"
                    className="max-w-4xl"
                >
                    <div className="p-4 sm:p-5">
                        <IngresarOrdenForm
                            onSuccess={handleOrderCreated}
                            onCancel={() => setIsCreateOrderModalOpen(false)}
                            embeddedMode
                        />
                    </div>
                </Modal>

                <AgregarEvidenciaTecnicaModal
                    isOpen={Boolean(createdOrderForEvidence)}
                    onClose={() => {
                        // Al cerrar evidencias, guardar para preguntar por impresión
                        const orderData = createdOrderForEvidence;
                        setCreatedOrderForEvidence(null);
                        if (orderData) {
                            // Pequeño delay para que no se encimen los modales
                            setTimeout(() => {
                                setOrderToPrint(orderData);
                                setShowPrintConfirm(true);
                            }, 300);
                        }
                    }}
                    orderId={createdOrderForEvidence?.id || 0}
                    onSuccess={() => {
                        // El onClose se encargará de mostrar la confirmación de impresión
                    }}
                />

                {/* Modal de Confirmación de Impresión */}
                <ConfirmDialog
                    isOpen={showPrintConfirm}
                    title="Orden Creada Exitosamente"
                    description={`La orden #${orderToPrint?.workOrderNumber} ha sido registrada. ¿Desea imprimir el comprobante de ingreso ahora?`}
                    confirmText="Sí, imprimir"
                    cancelText="No, después"
                    onConfirm={() => {
                        setShowPrintConfirm(false);
                        // Abrir modal de impresión (el PDF se genera con el ID de la orden)
                    }}
                    onClose={() => {
                        setShowPrintConfirm(false);
                        setOrderToPrint(null);
                    }}
                />

                {/* Modal de Generación de PDF (Ingreso) */}
                {orderToPrint && !showPrintConfirm && (
                    <GenerarPdfIngresoModal
                        isOpen={true}
                        onClose={() => setOrderToPrint(null)}
                        orderId={orderToPrint.id}
                    />
                )}
            </div>
        </div>
    );
}