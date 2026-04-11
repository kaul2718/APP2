'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import DetallePresupuestoItemTable from "@/components/tables/detallePresupuestoItemTable";

export default function DetallePresupuestoItemComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Detalle de Ítems" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de detalles de ítems registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-detalle-presupuesto-item")}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar detalle de ítem
                            </Button>
                        </div>
                    }
                >
                    <DetallePresupuestoItemTable />
                </ComponentCard>
            </div>
        </div>
    );
}