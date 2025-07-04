'use client';

import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsuarioTableOne from "@/components/tables/usuarioTable";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

export default function ClientComponent() {
    const router = useRouter();

    return (
        <div>
            <PageBreadcrumb pageTitle="Usuarios" />
            <div className="space-y-6">
                <ComponentCard
                    title={
                        <div className="flex justify-between items-center w-full">
                            <span>Lista de usuarios</span>
                            <Button
                                onClick={() => router.push("/ingresar-usuario")}
                                className="flex items-center gap-1"
                                size="sm" // Asegúrate de que tu componente Button soporte este prop
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Agregar Usuario
                            </Button>
                        </div>
                    }
                >
                    <UsuarioTableOne />
                </ComponentCard>
            </div>
        </div>
    );
}