'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import DetalleManoObraTable from "@/components/tables/detalleManoObraTable";

export default function DetalleManoObraComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Detalle Mano de Obra" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de detalles de mano de obra registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-detalle-mano-obra")}
                                className="flex items-center gap-1"
                                size="sm" 
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar detalle Mano Obra
                            </Button>
                        </div>
                    }
                >
                    <DetalleManoObraTable />
                </ComponentCard>
            </div>
        </div>
    );
}