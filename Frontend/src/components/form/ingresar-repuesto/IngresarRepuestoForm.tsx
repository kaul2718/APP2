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
import { CogIcon, CurrencyDollarIcon, DocumentTextIcon, TagIcon } from "@heroicons/react/24/outline";
import { usePartes } from "@/hooks/usePartes";

interface FormData {
    codigo: string;
    nombre: string;
    descripcion: string;
    precioVenta: number;
    parteId: number | null;
}

export default function IngresarRepuestoForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const { partes, loading: loadingPartes } = usePartes();
    const [formData, setFormData] = React.useState<FormData>({
        codigo: "",
        nombre: "",
        descripcion: "",
        precioVenta: 0,
        parteId: null
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

        if (!formData.codigo.trim()) {
            newErrors.codigo = "El código del repuesto es requerido";
        } else if (formData.codigo.trim().length < 2) {
            newErrors.codigo = "El código debe tener al menos 2 caracteres";
        }

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre del repuesto es requerido";
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
        }

        if (!formData.descripcion.trim()) {
            newErrors.descripcion = "La descripción es requerida";
        } else if (formData.descripcion.trim().length < 10) {
            newErrors.descripcion = "La descripción debe tener al menos 10 caracteres";
        }

        if (formData.precioVenta <= 0) {
            newErrors.precioVenta = "El precio debe ser mayor a 0";
        }

        if (!formData.parteId) {
            newErrors.parteId = "Debe seleccionar una parte";
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({
                    codigo: formData.codigo,
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    precioVenta: formData.precioVenta,
                    parteId: formData.parteId
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar repuesto");
                return;
            }

            toast.success("Repuesto registrado con éxito ✅");

            // Reset form
            setFormData({
                codigo: "",
                nombre: "",
                descripcion: "",
                precioVenta: 0,
                parteId: null
            });

            setTimeout(() => {
                router.push('/ver-repuesto');
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nuevo Repuesto">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Código del repuesto */}
                <div>
                    <Label>Código del Repuesto</Label>
                    <div className="relative">
                        <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.codigo}
                            onChange={(e) => handleChange("codigo", e.target.value)}
                            placeholder="Ej: SSD-001, NVME-123"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.codigo && <p className="text-sm text-red-500 mt-1">{errors.codigo}</p>}
                </div>

                {/* Nombre del repuesto */}
                <div>
                    <Label>Nombre del Repuesto</Label>
                    <div className="relative">
                        <CogIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: SSD ADATA, Batería HP MU06"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <Label>Descripción</Label>
                    <div className="relative">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4 pointer-events-none z-10" />
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => handleChange("descripcion", e.target.value)}
                            placeholder="Descripción detallada del repuesto..."
                            className="w-full pl-10 p-2 border rounded-md bg-white dark:bg-gray-800 text-black dark:text-white min-h-[100px]"
                        />
                    </div>
                    {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
                </div>

                {/* Precio de venta */}
                <div>
                    <Label>Precio de Venta</Label>
                    <div className="relative">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="number"
                            min="0"
                            step={0.01}
                            value={formData.precioVenta}
                            onChange={(e) => handleChange("precioVenta", parseFloat(e.target.value))}
                            placeholder="0.00"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.precioVenta && <p className="text-sm text-red-500 mt-1">{errors.precioVenta}</p>}
                </div>

                {/* Selección de parte */}
                <div>
                    <Label>Parte</Label>
                    <Select
                        value={formData.parteId || ""}
                        onChange={(e) => handleChange("parteId", Number(e.target.value))}
                        disabled={loadingPartes}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
                    >
                        <option value="">Seleccione una parte</option>
                        {partes.map((parte) => (
                            <option key={parte.id} value={parte.id}>
                                {parte.nombre}
                            </option>
                        ))}
                    </Select>
                    {errors.parteId && <p className="text-sm text-red-500 mt-1">{errors.parteId}</p>}
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading || loadingPartes}
                    >
                        {loading ? "Registrando..." : "Registrar Repuesto"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}