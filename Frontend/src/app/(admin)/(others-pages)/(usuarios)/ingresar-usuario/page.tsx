"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsuarioCreateModal from "@/components/modals/UsuarioCreateModal";
import React, { useState } from "react";
import { Usuario } from "@/hooks/useUsuario";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(true);

    const handleCloseModal = () => {
        router.push("/ver-usuario");
    };

    const handleSaveUsuario = (newUsuario: Usuario) => {
        console.log("✅ Usuario creado:", newUsuario);
        router.push("/ver-usuario");
    };

    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Usuario" />
            <UsuarioCreateModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUsuario}
            />
        </div>
    );
}
