'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import EstadoOrdenTable from "@/components/tables/estadoOrdenTable";

export default function EstadoOrdenComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Estado Orden" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de estados de orden registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-estado-orden")}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Estado Orden
                            </Button>
                        </div>
                    }
                >
                    <EstadoOrdenTable />
                </ComponentCard>
            </div>
        </div>
    );
}