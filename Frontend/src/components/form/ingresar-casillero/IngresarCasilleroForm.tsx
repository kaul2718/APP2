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

interface Props {
    embeddedMode?: boolean;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function IngresarCasilleroForm({
    embeddedMode = false,
    onSuccess,
    onClose,
}: Props) {
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
            const payload = {
                codigo: formData.codigo,
                descripcion: formData.descripcion
            };

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.accessToken || ""}`
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorMessage = res.statusText || "Error al registrar casillero";
                let errorDetails: any = {};

                try {
                    const data = await res.json();
                    if (data && (data.message || data.error)) {
                        errorMessage = data.message || data.error;
                        errorDetails = data;
                    }
                } catch (jsonError) {
                    try {
                        const text = await res.text();
                        if (text) errorMessage = text;
                    } catch (textError) {
                        console.error("No se pudo leer la respuesta de error:", textError);
                    }
                }

                console.error("Error en el servidor:", {
                    status: res.status,
                    statusText: res.statusText,
                    url: res.url,
                    message: errorMessage,
                    details: errorDetails
                });

                toast.error(`Error ${res.status}: ${errorMessage}`);
                return;
            }

            await res.json();
            toast.success("Casillero registrado con éxito ✅");
            setFormData({ codigo: "", descripcion: "" });

            if (embeddedMode) {
                onSuccess?.();
                onClose?.();
            } else {
                setTimeout(() => router.push('/ver-casillero'), 1000);
            }
        } catch (error) {
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

    const formContent = (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
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

            <div className={embeddedMode ? "flex justify-end gap-4" : ""}>
                {embeddedMode && onClose && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                )}
                <Button
                    type="submit"
                    className={embeddedMode ? "flex items-center justify-center gap-2" : "w-full flex items-center justify-center gap-2"}
                    disabled={loading}
                >
                    {loading ? "Registrando..." : "Registrar Casillero"}
                </Button>
            </div>
        </form>
    );

    if (embeddedMode) {
        return <div className="p-4">{formContent}</div>;
    }

    return <ComponentCard title="Registrar Nuevo Casillero">{formContent}</ComponentCard>;
}