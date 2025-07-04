'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import EquipoTableOne from "@/components/tables/equipoTable";

export default function EquipoComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Equipo" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de Equipos</span>
                            <Button
                                onClick={() => router.push("/ingresar-equipo")}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Equipo
                            </Button>
                        </div>
                    }
                >
                    <EquipoTableOne />
                </ComponentCard>
            </div>
        </div>
    );
}