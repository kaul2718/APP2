'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import ParteTable from "@/components/tables/parteTable";

export default function ParteComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Partes" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de partes registradas</span>
                            <Button
                                onClick={() => router.push("/ingresar-parte")}
                                className="flex items-center gap-1"
                                size="sm" // Asegúrate de que tu componente Button soporte este prop
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Parte
                            </Button>
                        </div>
                    }
                >
                    <ParteTable />
                </ComponentCard>
            </div>
        </div>
    );
}