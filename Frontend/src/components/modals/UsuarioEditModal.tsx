"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Usuario } from "@/hooks/useUsuario";
import { UsuarioForm, UsuarioFormData } from "@/components/form/usuario";
import { useRoles } from "@/hooks/useRoles";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    usuario: Usuario | null;
    onSave: (updatedUsuario: Usuario) => void;
}

export default function UsuarioEditModal({ isOpen, onClose, usuario, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [cargando, setCargando] = React.useState(false);
    const { roles, loading: rolesLoading } = useRoles();

    if (!usuario) return null;

    // Convertir Usuario a UsuarioFormData
    // usuario.role es string (slug), pero UsuarioFormData espera number (ID)
    const roleId = roles.find(r => r.slug === usuario.role)?.id || 0;
    
    const usuarioFormData: UsuarioFormData = {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        ciudad: usuario.ciudad,
        role: roleId,
        estado: usuario.estado,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
        deletedAt: usuario.deletedAt,
    };

    const handleSubmit = async (formData: UsuarioFormData, camposModificados?: Set<string>) => {
        if (!token || !camposModificados || camposModificados.size === 0) {
            toast.info("No se realizaron cambios");
            return;
        }

        // Esperar a que carguen los roles si aún no han cargado
        if (rolesLoading) {
            toast.warning("Los roles aún se están cargando. Intenta nuevamente.");
            return;
        }

        setCargando(true);
        try {
            // Preparar solo los campos modificados
            const cambios: Record<string, any> = {};

            camposModificados.forEach((campo) => {
                const valor = formData[campo as keyof UsuarioFormData];
                if (valor !== undefined && valor !== null) {
                    // Si es role, mapear directamente a roleIds
                    if (campo === 'role' && typeof valor === 'number' && valor > 0) {
                        cambios['roleIds'] = [valor];
                    } else if (campo !== 'role') {
                        // Enviar otros campos tal cual
                        cambios[campo] = valor;
                    }
                }
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${usuario.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(cambios),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            const data = await response.json();
            onSave(data);
            toast.success("Cambios guardados correctamente");
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
        } finally {
            setCargando(false);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Editar Usuario"
            onSubmit={async () => Promise.resolve()}
            loading={cargando}
            mode="edit"
            hideActions
        >
            <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del usuario
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Modifica los datos del usuario. Solo los campos cambiados se actualizarán.
                </p>

                <UsuarioForm
                    mode="edit"
                    initialData={usuarioFormData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={cargando}
                    isModal={true}
                />
            </div>
        </CrudModal>
    );
}