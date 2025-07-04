'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import EspecificacionParteTable from "@/components/tables/especificacionParteTable";

export default function EspecificacionParteComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Especificacion Parte" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de especificación parte registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-especificacion-parte")}
                                className="flex items-center gap-1"
                                size="sm" // Asegúrate de que tu componente Button soporte este prop
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Especificacion Parte
                            </Button>
                        </div>
                    }
                >
                    <EspecificacionParteTable />
                </ComponentCard>
            </div>
        </div>
    );
}