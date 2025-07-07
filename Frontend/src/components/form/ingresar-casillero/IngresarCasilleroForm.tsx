"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";

interface FormData {
    codigo: string;
    descripcion: string;
}

export default function IngresarCasilleroForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = React.useState<FormData>({
        codigo: "",
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

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.codigo.trim()) {
            newErrors.codigo = "El código del casillero es requerido";
        } else if (formData.codigo.trim().length < 2) {
            newErrors.codigo = "El código debe tener al menos 2 caracteres";
        }

        if (!formData.descripcion.trim()) {
            newErrors.descripcion = "La descripción es requerida";
        } else if (formData.descripcion.trim().length < 5) {
            newErrors.descripcion = "La descripción debe tener al menos 5 caracteres";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateFields()) {
            setLoading(false);
            return;
        }

        try {
            // 1. Preparar los datos y headers
            const payload = {
                codigo: formData.codigo,
                descripcion: formData.descripcion
            };

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.accessToken || ""}`
            };

            // 2. Realizar la petición
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            // 3. Manejar la respuesta
            if (!res.ok) {
                // Intentar obtener el mensaje de error de varias formas
                let errorMessage = res.statusText || "Error al registrar casillero";
                let errorDetails: any = {};

                try {
                    // Primero intentar parsear como JSON
                    const data = await res.json();
                    if (data && (data.message || data.error)) {
                        errorMessage = data.message || data.error;
                        errorDetails = data;
                    }
                } catch (jsonError) {
                    // Si falla el JSON, intentar como texto
                    try {
                        const text = await res.text();
                        if (text) errorMessage = text;
                    } catch (textError) {
                        console.error("No se pudo leer la respuesta de error:", textError);
                    }
                }

                // Log detallado para depuración
                console.error("Error en el servidor:", {
                    status: res.status,
                    statusText: res.statusText,
                    url: res.url,
                    message: errorMessage,
                    details: errorDetails
                });

                // Mostrar mensaje al usuario
                toast.error(`Error ${res.status}: ${errorMessage}`);
                return;
            }

            // 4. Procesar respuesta exitosa
            const responseData = await res.json();
            toast.success("Casillero registrado con éxito ✅");
            setFormData({ codigo: "", descripcion: "" });

            // Redirigir después de 1 segundo
            setTimeout(() => router.push('/ver-casillero'), 1000);

        } catch (error) {
            // Manejar errores de red u otros errores inesperados
            console.error("Error en la solicitud:", error);

            let userErrorMessage = "Error en la solicitud";
            if (error instanceof Error) {
                userErrorMessage = error.message;
            } else if (typeof error === "string") {
                userErrorMessage = error;
            }

            toast.error(userErrorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nuevo Casillero">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Código del casillero */}
                <div>
                    <Label>Código del Casillero</Label>
                    <div className="relative">
                        <ArchiveBoxIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.codigo}
                            onChange={(e) => handleChange("codigo", e.target.value)}
                            placeholder="Ej: A1, B2, C3"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.codigo && <p className="text-sm text-red-500 mt-1">{errors.codigo}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <Label>Descripción</Label>
                    <div className="relative">
                        <ArchiveBoxIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.descripcion}
                            onChange={(e) => handleChange("descripcion", e.target.value)}
                            placeholder="Ej: Casillero principal, Casillero de reparación rápida"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : "Registrar Casillero"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}