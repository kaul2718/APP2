'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ModeloTable from "@/components/tables/modeloTable";
import InventarioTable from "@/components/tables/inventarioTable";

export default function InventarioComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Inventario" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de inventario registrado</span>
                            <Button
                                onClick={() => router.push("/ingresar-inventario")}
                                className="flex items-center gap-1"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Producto
                            </Button>
                        </div>
                    }
                >
                    <InventarioTable />
                </ComponentCard>
            </div>
        </div>
    );
}