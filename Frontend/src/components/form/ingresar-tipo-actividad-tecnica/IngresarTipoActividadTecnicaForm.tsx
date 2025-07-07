"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import TextArea from "@/components/form/input/TextArea";

interface FormData {
    nombre: string;
    descripcion: string;
}

export default function IngresarTipoActividadTecnicaForm() {
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

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre del tipo de actividad es requerido";
        } else if (formData.nombre.trim().length < 3) {
            newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
        }

        if (formData.descripcion && formData.descripcion.length > 500) {
            newErrors.descripcion = "La descripción no puede exceder los 500 caracteres";
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    descripcion: formData.descripcion || null
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar el tipo de actividad técnica");
                return;
            }

            toast.success("Tipo de actividad técnica registrado con éxito ✅");

            setFormData({ nombre: "", descripcion: "" });

            setTimeout(() => {
                router.push('/ver-tipo-actividad-tecnica');
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nuevo Tipo de Actividad Técnica">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Nombre del tipo */}
                <div>
                    <Label>Nombre del Tipo de Actividad</Label>
                    <div className="relative">
                        <ClipboardDocumentIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Mantenimiento preventivo, Reparación, Calibración"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <Label>Descripción (Opcional)</Label>
                    <TextArea
                        value={formData.descripcion}
                        onChange={(e) => handleChange("descripcion", e.target.value)}
                        placeholder="Descripción detallada del tipo de actividad..."
                        rows={4}
                        className="bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        {formData.descripcion.length}/500 caracteres
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
                        {loading ? "Registrando..." : "Registrar Tipo de Actividad"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}