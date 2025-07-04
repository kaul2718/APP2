'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import TipoActividadTecnicaTable from "@/components/tables/tipoActividadTecnicaTable";

export default function TipoActividadTecnicaComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Tipo Actividad Técnica" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de Tipos Actividad Técnica registradas</span>
                            <Button
                                onClick={() => router.push("/ingresar-tipo-actividad-tecnica")}
                                className="flex items-center gap-1"
                                size="sm" 
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Tipo Actividad Técnica
                            </Button>
                        </div>
                    }
                >
                    <TipoActividadTecnicaTable />
                </ComponentCard>
            </div>
        </div>
    );
}