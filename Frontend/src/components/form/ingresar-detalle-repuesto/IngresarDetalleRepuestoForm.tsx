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
import { CurrencyDollarIcon, HashtagIcon, TagIcon } from "@heroicons/react/24/outline";
import { useRepuesto } from "@/hooks/useRepuesto";

interface FormData {
    presupuestoId: number | string;
    repuestoId: number | string;
    cantidad: number | string;
    comentario?: string;
}

interface IngresarDetalleRepuestoFormProps {
    presupuestoId?: number;
    onSuccess?: () => void;
}

export default function IngresarDetalleRepuestoForm({
    presupuestoId: initialPresupuestoId,
    onSuccess
}: IngresarDetalleRepuestoFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { repuestos, loading: loadingRepuestos } = useRepuesto();

    const [formData, setFormData] = React.useState<FormData>({
        presupuestoId: initialPresupuestoId || "",
        repuestoId: "",
        cantidad: 1,
        comentario: ""
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

        if (!formData.presupuestoId) {
            newErrors.presupuestoId = "El presupuesto es requerido";
        }

        if (!formData.repuestoId) {
            newErrors.repuestoId = "El repuesto es requerido";
        }

        if (!formData.cantidad) {
            newErrors.cantidad = "La cantidad es requerida";
        } else if (Number(formData.cantidad) <= 0) {
            newErrors.cantidad = "La cantidad debe ser mayor a 0";
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
            // Construimos el payload asegurándonos de que solo incluya presupuestoId
            const payload = {
                presupuestoId: Number(formData.presupuestoId),
                repuestoId: Number(formData.repuestoId),
                cantidad: Number(formData.cantidad),
                comentario: formData.comentario || undefined // Enviamos undefined si está vacío
            };

            // Eliminamos cualquier campo undefined del payload
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, v]) => v !== undefined)
            );

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify(cleanPayload),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.message || "Error al registrar detalle de repuesto");
            }

            toast.success("Repuesto agregado al presupuesto con éxito ✅");

            // Reset form (excepto presupuestoId si viene como prop)
            setFormData(prev => ({
                presupuestoId: initialPresupuestoId || "",
                repuestoId: "",
                cantidad: 1,
                comentario: ""
            }));

            // Ejecutar callback de éxito si existe
            if (onSuccess) {
                onSuccess();
            } else if (initialPresupuestoId) {
                router.refresh();
            } else {
                router.push('/presupuestos');
            }

        } catch (error) {
            console.error("Error:", error);
            toast.error(error instanceof Error ? error.message : "Error al registrar repuesto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Agregar Repuesto al Presupuesto">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Presupuesto ID (solo si no viene como prop) */}
                {!initialPresupuestoId && (
                    <div>
                        <Label>ID del Presupuesto</Label>
                        <div className="relative">
                            <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <Input
                                type="number"
                                value={formData.presupuestoId}
                                onChange={(e) => handleChange("presupuestoId", e.target.value)}
                                placeholder="Ingrese el ID del presupuesto"
                                className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                            />
                        </div>
                        {errors.presupuestoId && <p className="text-sm text-red-500 mt-1">{errors.presupuestoId}</p>}
                    </div>
                )}

                {/* Repuesto */}
                <div>
                    <Label>Repuesto</Label>
                    <div className="relative">
                        <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Select
                            value={formData.repuestoId}
                            onChange={(e) => handleChange("repuestoId", e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            disabled={loadingRepuestos}
                        >
                            <option value="">Seleccione un repuesto</option>
                            {repuestos
                                .filter(repuesto => repuesto.estado)
                                .map((repuesto) => (
                                    <option key={repuesto.id} value={repuesto.id}>
                                        {repuesto.nombre} (${repuesto.precioVenta})
                                    </option>
                                ))}
                        </Select>
                    </div>
                    {errors.repuestoId && <p className="text-sm text-red-500 mt-1">{errors.repuestoId}</p>}
                </div>

                {/* Cantidad */}
                <div>
                    <Label>Cantidad</Label>
                    <div className="relative">
                        <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="number"
                            min="1"
                            step={1}
                            value={formData.cantidad}
                            onChange={(e) => handleChange("cantidad", e.target.value)}
                            placeholder="Cantidad"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.cantidad && <p className="text-sm text-red-500 mt-1">{errors.cantidad}</p>}
                </div>

                {/* Comentario (opcional) */}
                <div>
                    <Label>Comentario (opcional)</Label>
                    <Input
                        type="text"
                        value={formData.comentario}
                        onChange={(e) => handleChange("comentario", e.target.value)}
                        placeholder="Notas adicionales sobre este repuesto"
                        className="bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading || loadingRepuestos}
                    >
                        {loading ? "Agregando..." : "Agregar Repuesto"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}