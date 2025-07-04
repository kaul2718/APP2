"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { TagIcon } from "@heroicons/react/24/outline";

interface FormData {
    nombre: string;
    descripcion: string;
}

export default function IngresarCategoriaForm() {
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
            newErrors.nombre = "El nombre de la categoría es requerido";
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    descripcion: formData.descripcion
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar categoría");
                return;
            }

            toast.success("Categoría registrada con éxito ✅");

            setFormData({ nombre: "", descripcion: "" });

            setTimeout(() => {
                router.push('/ver-categoria');
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nueva Categoría">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Nombre de la categoría */}
                <div>
                    <Label>Nombre de la Categoría</Label>
                    <div className="relative">
                        <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Smartphones, Laptops, Accesorios"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <Label>Descripción</Label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange("descripcion", e.target.value)}
                        placeholder="Ingrese una descripción detallada de la categoría"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                        rows={3}
                    />
                    {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : "Registrar Categoría"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}