"use client";

import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { UsuarioForm, UsuarioFormData } from "@/components/form/usuario";
import { useRoles } from "@/hooks/useRoles";

export default function IngresarUsuarioNuevoForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const { roles } = useRoles();

    const initialData: UsuarioFormData = {
        cedula: "",
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        password: "",
        confirmPassword: "",
        role: 0,
    };

    const handleSubmit = async (formData: UsuarioFormData) => {
        // Verificar sesión primero
        if (!session?.accessToken) {
            toast.error("No hay sesión activa. Por favor, inicie sesión.");
            return;
        }

        setLoading(true);

        try {
            // Validar URL del backend
            if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                throw new Error("Configuración de backend no disponible");
            }

            const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`;
            
            const payload = {
                cedula: formData.cedula,
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.correo,
                telefono: formData.telefono,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                password: formData.password,
                roleIds: formData.role > 0 ? [formData.role] : [],
            };

            // Validar payload antes de enviar
            if (Object.values(payload).some((val) => val === undefined || val === null)) {
                throw new Error("Datos del formulario incompletos");
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            // Manejar errores HTTP
            if (!res.ok) {
                let errorMessage = "Error al registrar usuario";

                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error("Error response from server:", errorData);

                    // Manejo específico de errores comunes
                    if (res.status === 401) {
                        errorMessage = "No autorizado. Token inválido o expirado";
                    } else if (res.status === 409) {
                        errorMessage = errorData.message || "El usuario ya existe";
                    } else if (res.status === 400) {
                        errorMessage = `Datos inválidos: ${errorData.message || JSON.stringify(errorData)}`;
                    } else if (res.status === 500) {
                        errorMessage = `Error del servidor: ${errorData.message || errorData.error || "Intenta de nuevo más tarde"}`;
                    }
                } catch (parseError) {
                    console.error("Error al parsear respuesta de error:", parseError);
                }

                throw new Error(errorMessage);
            }

            // Procesar respuesta exitosa
            const data = await res.json();

            // Validar respuesta del servidor
            if (!data || !data.id) {
                throw new Error("Respuesta inválida del servidor");
            }

            toast.success("Usuario registrado con éxito ✅");

            // Redirección con manejo de error
            try {
                await router.push("/ver-usuario");
            } catch (navigationError) {
                console.error("Error en redirección:", navigationError);
                toast.warning("Usuario creado pero hubo un error en la redirección");
            }
        } catch (error) {
            // Mostrar mensajes de error específicos
            if (error instanceof Error) {
                toast.error(error.message || "Error al procesar la solicitud");
            } else {
                toast.error("Error desconocido al procesar la solicitud");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/ver-usuario");
    };

    return (
        <ComponentCard title="Registrar Nuevo Usuario">
            <UsuarioForm
                mode="create"
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={loading}
            />
        </ComponentCard>
    );
}