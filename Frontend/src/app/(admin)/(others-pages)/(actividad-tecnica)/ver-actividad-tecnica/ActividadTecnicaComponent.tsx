'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ModeloTable from "@/components/tables/modeloTable";
import ActividadTecnicaTable from "@/components/tables/actividadTecnicaTable";

export default function ActividadTecnicaComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Modelo" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de actividades tecnicas registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-actividad-tecnica")}
                                className="flex items-center gap-1"
                                size="sm" 
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Actividad Técnica
                            </Button>
                        </div>
                    }
                >
                    <ActividadTecnicaTable />
                </ComponentCard>
            </div>
        </div>
    );
}