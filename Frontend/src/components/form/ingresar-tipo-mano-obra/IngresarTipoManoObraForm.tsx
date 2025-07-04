"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Select } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { CurrencyDollarIcon, CodeBracketIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

interface FormData {
    nombre: string;
    codigo: string;
    descripcion: string;
    costo: number | string;
}

export default function IngresarTipoManoObraForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = React.useState<FormData>({
        nombre: "",
        codigo: "",
        descripcion: "",
        costo: ""
    });
    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    const handleChange = (field: keyof FormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es requerido";
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
        }

        if (!formData.codigo.trim()) {
            newErrors.codigo = "El código es requerido";
        }

        if (!formData.costo) {
            newErrors.costo = "El costo es requerido";
        } else if (Number(formData.costo) <= 0) {
            newErrors.costo = "El costo debe ser mayor a 0";
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    codigo: formData.codigo,
                    descripcion: formData.descripcion || null,
                    costo: Number(formData.costo),
                    estado: true
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar tipo de mano de obra");
                return;
            }

            toast.success("Tipo de mano de obra registrado con éxito ✅");

            setFormData({
                nombre: "",
                codigo: "",
                descripcion: "",
                costo: ""
            });

            setTimeout(() => {
                router.push('/ver-tipo-mano-obra');
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nuevo Tipo de Mano de Obra">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Nombre */}
                <div>
                    <Label>Nombre del Tipo</Label>
                    <div className="relative">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Cambio Pantalla, Cambio Teclado, Mantenimiento"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Código */}
                <div>
                    <Label>Código Único</Label>
                    <div className="relative">
                        <CodeBracketIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.codigo}
                            onChange={(e) => handleChange("codigo", e.target.value)}
                            placeholder="Ej: CAMPA-001, CAMTEC-001, MANPRE-001"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.codigo && <p className="text-sm text-red-500 mt-1">{errors.codigo}</p>}
                </div>

                {/* Costo */}
                <div>
                    <Label>Costo por Hora</Label>
                    <div className="relative">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="number"
                            step={5.00}
                            min="1"
                            value={formData.costo}
                            onChange={(e) => handleChange("costo", e.target.value)}
                            placeholder="Ej: 15.00"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.costo && <p className="text-sm text-red-500 mt-1">{errors.costo}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <Label>Descripción (Opcional)</Label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange("descripcion", e.target.value)}
                        placeholder="Descripción detallada del tipo de mano de obra"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : "Registrar Tipo de Mano de Obra"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}