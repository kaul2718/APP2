'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import DetalleRepuestoTable from "@/components/tables/detalleRepuestoTable";

export default function DetalleRepuestoComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Detalle Repuestos" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de detalles de repuestos registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-detalle-repuesto")}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar detalle repuestos
                            </Button>
                        </div>
                    }
                >
                    <DetalleRepuestoTable />
                </ComponentCard>
            </div>
        </div>
    );
}