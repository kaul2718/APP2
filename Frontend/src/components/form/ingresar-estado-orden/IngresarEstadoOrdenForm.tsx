"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface FormData {
    nombre: string;
    descripcion: string;
}

export default function IngresarEstadoOrdenForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = React.useState<FormData>({
        nombre: "",
        descripcion: ""
    });
    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Función de validación mejorada
    const validateFields = () => {
        const newErrors: Partial<FormData> = {};
        let isValid = true;

        // Validación de nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre del estado es requerido";
            isValid = false;
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
            isValid = false;
        } else if (formData.nombre.trim().length > 50) {
            newErrors.nombre = "El nombre no puede exceder los 50 caracteres";
            isValid = false;
        }

        // Validación de descripción
        if (formData.descripcion && formData.descripcion.length > 500) {
            newErrors.descripcion = "La descripción no puede exceder los 500 caracteres";
            isValid = false;
        }

        setErrors(newErrors);

        // Scroll al primer error si hay alguno
        if (!isValid) {
            const firstErrorKey = Object.keys(newErrors)[0];
            if (firstErrorKey) {
                const element = document.querySelector(`[name="${firstErrorKey}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación inicial
        if (!validateFields()) {
            return;
        }

        setLoading(true);

        try {
            // Validación de sesión
            if (!session?.accessToken) {
                throw new Error("No hay sesión activa");
            }

            // Validación de datos del formulario
            if (!formData.nombre.trim()) {
                throw new Error("El nombre no puede estar vacío");
            }

            // Validación de longitud máxima
            if (formData.descripcion && formData.descripcion.length > 500) {
                throw new Error("La descripción no puede exceder los 500 caracteres");
            }

            const payload = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion?.trim() || null
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(8000) // Timeout de 8 segundos
            });

            // Manejo de errores HTTP
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));

                // Errores específicos del backend
                if (res.status === 409) {
                    throw new Error("Ya existe un estado de orden con ese nombre");
                } else if (res.status === 400) {
                    throw new Error(errorData.message || "Datos inválidos");
                } else if (res.status === 401) {
                    throw new Error("No autorizado - sesión expirada");
                } else if (res.status >= 500) {
                    throw new Error("Error en el servidor");
                } else {
                    throw new Error(`Error ${res.status}: ${res.statusText}`);
                }
            }

            const data = await res.json();

            // Validación de respuesta
            if (!data.id || !data.nombre) {
                throw new Error("Respuesta inválida del servidor");
            }

            // Éxito
            toast.success("Estado de orden registrado con éxito ✅", {
                autoClose: 2000,
                pauseOnHover: false
            });

            // Reset del formulario
            setFormData({ nombre: "", descripcion: "" });
            setErrors({});

            // Redirección con delay
            setTimeout(() => {
                router.push('/ver-estado-orden');
            }, 1000);

        } catch (error) {
            console.error("Error en el formulario:", error);

            // Manejo de diferentes tipos de errores
            let errorMessage = "Error al registrar estado de orden";

            if (error instanceof DOMException && error.name === "AbortError") {
                errorMessage = "La solicitud tardó demasiado. Intente nuevamente";
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {
                autoClose: 5000,
                pauseOnHover: true
            });

            // Enfocar el primer campo con error
            if (!formData.nombre.trim()) {
                const nombreInput = document.querySelector('input[name="nombre"]');
                if (nombreInput instanceof HTMLElement) {
                    nombreInput.focus();
                }
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nuevo Estado de Orden">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Nombre del estado */}
                <div>
                    <Label>Nombre del Estado</Label>
                    <div className="relative">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Pendiente, En Proceso, Completado"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <Label>Descripción (Opcional)</Label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange("descripcion", e.target.value)}
                        placeholder="Descripción del estado de orden"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                        rows={3}
                    />
                    {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.descripcion.length}/500 caracteres
                    </p>
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : "Registrar Estado"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}