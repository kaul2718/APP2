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
import { HashtagIcon, TagIcon } from "@heroicons/react/24/outline";
import { Parte, usePartes } from "@/hooks/usePartes";

interface FormData {
    presupuestoId: number | string;
    parteId: number | string;
    cantidad: number | string;
    comentario?: string;
}

interface IngresarDetallePresupuestoItemFormProps {
    presupuestoId?: number;
    onSuccess?: () => void;
}

export default function IngresarDetallePresupuestoItemForm({
    presupuestoId: initialPresupuestoId,
    onSuccess
}: IngresarDetallePresupuestoItemFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { fetchAllPartes } = usePartes();
    const [partesDisponibles, setPartesDisponibles] = React.useState<Parte[]>([]);
    const [loadingPartes, setLoadingPartes] = React.useState(false);

    const [formData, setFormData] = React.useState<FormData>({
        presupuestoId: initialPresupuestoId || "",
        parteId: "",
        cantidad: 1,
        comentario: ""
    });

    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!session?.accessToken) return;

        let isMounted = true;

        const loadPartes = async () => {
            setLoadingPartes(true);
            try {
                const data = await fetchAllPartes(false);
                if (isMounted) {
                    setPartesDisponibles(data.filter((parte) => parte.estado));
                }
            } catch (error) {
                if (isMounted) {
                    toast.error(error instanceof Error ? error.message : "Error al cargar el catálogo");
                }
            } finally {
                if (isMounted) {
                    setLoadingPartes(false);
                }
            }
        };

        void loadPartes();

        return () => {
            isMounted = false;
        };
    }, [session?.accessToken]);

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

        if (!formData.parteId) {
            newErrors.parteId = "El ítem es requerido";
        }

        if (!formData.cantidad) {
            newErrors.cantidad = "La cantidad es requerida";
        } else if (Number(formData.cantidad) <= 0) {
            newErrors.cantidad = "La cantidad debe ser mayor a 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatParteLabel = (parte: Parte) => {
        const codigo = parte.codigoInterno || `ITEM-${parte.id}`;
        const precio = Number(parte.precioReferencia ?? 0);
        return `${parte.nombre} - ${codigo} ($${precio.toLocaleString('es-CL')})`;
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
                parteId: Number(formData.parteId),
                cantidad: Number(formData.cantidad),
                comentario: formData.comentario || undefined // Enviamos undefined si está vacío
            };

            // Eliminamos cualquier campo undefined del payload
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, v]) => v !== undefined)
            );

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify(cleanPayload),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.message || "Error al registrar detalle del ítem");
            }

            toast.success("Ítem agregado al presupuesto con éxito ✅");

            // Reset form (excepto presupuestoId si viene como prop)
            setFormData(prev => ({
                presupuestoId: initialPresupuestoId || "",
                parteId: "",
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
            toast.error(error instanceof Error ? error.message : "Error al registrar el ítem");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Agregar Ítem al Presupuesto">
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

                {/* Ítem / Parte */}
                <div>
                    <Label>Ítem / Parte</Label>
                    <div className="relative">
                        <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Select
                            value={formData.parteId}
                            onChange={(e) => handleChange("parteId", e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            disabled={loadingPartes}
                        >
                            <option value="">Seleccione un ítem</option>
                            {partesDisponibles.map((parte) => (
                                <option key={parte.id} value={parte.id}>
                                    {formatParteLabel(parte)}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {errors.parteId && <p className="text-sm text-red-500 mt-1">{errors.parteId}</p>}
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
                        placeholder="Notas adicionales sobre este ítem"
                        className="bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                </div>

                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading || loadingPartes}
                    >
                        {loading ? "Agregando..." : "Agregar Ítem"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}