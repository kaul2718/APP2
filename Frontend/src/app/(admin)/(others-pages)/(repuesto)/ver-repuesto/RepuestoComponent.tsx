'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import RepuestoTable from "@/components/tables/repuestoTable";

export default function RepuestoComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Repuestos" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de repuestos registrados</span>
                            <Button
                                onClick={() => router.push("/ingresar-repuesto")}
                                className="flex items-center gap-1"
                                size="sm" // Asegúrate de que tu componente Button soporte este prop
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Repuesto
                            </Button>
                        </div>
                    }
                >
                    <RepuestoTable />
                </ComponentCard>
            </div>
        </div>
    );
}