"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { UsuarioForm, UsuarioFormData } from "@/components/form/usuario";
import { useRoles } from "@/hooks/useRoles";
import { Usuario } from "@/hooks/useUsuario";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newUsuario: Usuario) => void;
}

export default function UsuarioCreateModal({ isOpen, onClose, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [cargando, setCargando] = React.useState(false);
    const { roles, loading: rolesLoading } = useRoles();

    // Datos iniciales vacíos para crear un nuevo usuario
    const emptyUsuarioData: UsuarioFormData = {
        cedula: "",
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        role: 0,
        password: "",
        confirmPassword: "",
    };

    const handleSubmit = async (formData: UsuarioFormData) => {
        if (!token) {
            toast.error("No hay sesión activa");
            return;
        }

        // Esperar a que carguen los roles si aún no han cargado
        if (rolesLoading) {
            toast.warning("Los roles aún se están cargando. Intenta nuevamente.");
            return;
        }

        setCargando(true);
        try {
            // Preparar los datos para crear el usuario
            const datosCreacion: Record<string, any> = {
                cedula: formData.cedula,
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.correo,
                telefono: formData.telefono,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
            };

            // Solo incluir password si se proporciona
            if (formData.password) {
                datosCreacion.password = formData.password;
            }

            // Mapear role (ID numérico) a roleIds
            if (formData.role && formData.role > 0) {
                datosCreacion.roleIds = [formData.role];
            } else {
                throw new Error("Debe seleccionar un rol");
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(datosCreacion),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            const data = await response.json();
            onSave(data);
            toast.success("Usuario creado correctamente");
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al crear usuario");
        } finally {
            setCargando(false);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            className="max-w-[800px] m-4"
            title="Crear Usuario"
        >
            <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Crear Usuario
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Completa todos los campos requeridos. La contraseña es opcional.
                </p>

                <UsuarioForm
                    mode="create"
                    initialData={emptyUsuarioData}
                    onSubmit={handleSubmit}
                    isLoading={cargando}
                    onCancel={handleCancel}
                />
            </div>
        </Modal>
    );
}
