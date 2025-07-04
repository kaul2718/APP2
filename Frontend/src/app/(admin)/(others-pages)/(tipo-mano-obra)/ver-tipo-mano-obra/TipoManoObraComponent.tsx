'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ModeloTable from "@/components/tables/modeloTable";
import TipoManoObraTable from "@/components/tables/tipoManoObraTable";

export default function TipoManoObraComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Tipos de Mano de Obra" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de tipos de mano de obra registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-tipo-mano-obra")}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Tipo Mano Obra
                            </Button>
                        </div>
                    }
                >
                    <TipoManoObraTable />
                </ComponentCard>
            </div>
        </div>
    );
}