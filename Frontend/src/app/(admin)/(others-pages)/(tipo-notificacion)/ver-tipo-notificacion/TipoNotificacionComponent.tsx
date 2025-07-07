'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import TipoNotificacionTable from "@/components/tables/tipoNotificacionTable";

export default function TipoNotificacionComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Tipo Notificacion" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de tipos de notificación registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-tipo-notificacion")}
                                className="flex items-center gap-1"
                                size="sm" 
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Tipo Notificacion
                            </Button>
                        </div>
                    }
                >
                    <TipoNotificacionTable />
                </ComponentCard>
            </div>
        </div>
    );
}