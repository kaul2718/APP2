'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ModeloTable from "@/components/tables/modeloTable";
import OrdenTable from "@/components/tables/ordenTable";

export default function OrdenComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Ordenes" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de ordenes registradas</span>
                            <Button
                                onClick={() => router.push("/ingresar-orden")}
                                className="flex items-center gap-1"
                                size="sm"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Orden
                            </Button>
                        </div>
                    }
                >
                    <OrdenTable />
                </ComponentCard>
            </div>
        </div>
    );
}