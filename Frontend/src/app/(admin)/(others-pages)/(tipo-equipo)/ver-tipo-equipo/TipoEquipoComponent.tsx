'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import TipoEquipoTable from "@/components/tables/tipoEquipoTable";

export default function TipoEquipoComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Tipos de Equipos" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de Tipo de Equipo</span>
                            <Button
                                onClick={() => router.push("/ingresar-tipo-equipo")}
                                className="flex items-center gap-1"
                                size="sm" // Asegúrate de que tu componente Button soporte este prop
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Tipo
                            </Button>
                        </div>
                    }
                >
                    <TipoEquipoTable />
                </ComponentCard>
            </div>
        </div>
    );
}