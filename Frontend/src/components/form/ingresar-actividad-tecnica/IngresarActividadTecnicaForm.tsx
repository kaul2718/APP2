"use client";
import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Select } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { DocumentTextIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useTipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";
import { useOrders } from "@/hooks/useOrders";
import TextArea from "@/components/form/input/TextArea";

interface FormData {
    ordenId: number | null;
    tipoActividadId: number | null;
    diagnostico: string;
    trabajoRealizado: string;
}

interface Props {
    onSuccess?: (newActividad: {
        id: number;
        diagnostico: string;
        trabajoRealizado: string;
        fecha: string;
        orden: { id: number; workOrderNumber: string };
        tipoActividad: { id: number; nombre: string };
    }) => void;
    onClose?: () => void;
    defaultOrderId?: number;
}

export default function IngresarActividadTecnicaForm({ onSuccess, onClose, defaultOrderId }: Props) {
    const { data: session } = useSession();
    const { tipos: tiposActividad = [], loading: loadingTipos } = useTipoActividadTecnica();
    const { orders, loading: loadingOrders } = useOrders();
    const [formData, setFormData] = React.useState<FormData>({
        ordenId: defaultOrderId || null,
        tipoActividadId: null,
        diagnostico: "",
        trabajoRealizado: ""
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

        if (!formData.ordenId) {
            newErrors.ordenId = "Debe seleccionar una orden";
        }

        if (!formData.tipoActividadId) {
            newErrors.tipoActividadId = "Debe seleccionar un tipo de actividad";
        }

        if (!formData.diagnostico.trim()) {
            newErrors.diagnostico = "El diagnóstico es requerido";
        } else if (formData.diagnostico.trim().length < 10) {
            newErrors.diagnostico = "El diagnóstico debe tener al menos 10 caracteres";
        }

        if (!formData.trabajoRealizado.trim()) {
            newErrors.trabajoRealizado = "El trabajo realizado es requerido";
        } else if (formData.trabajoRealizado.trim().length < 10) {
            newErrors.trabajoRealizado = "El trabajo realizado debe tener al menos 10 caracteres";
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({
                    ordenId: formData.ordenId,
                    tipoActividadId: formData.tipoActividadId,
                    diagnostico: formData.diagnostico,
                    trabajoRealizado: formData.trabajoRealizado
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar actividad técnica");
                return;
            }

            const newActividad = await res.json();
            toast.success("Actividad técnica registrada con éxito ✅");

            setFormData({
                ordenId: defaultOrderId || null,
                tipoActividadId: null,
                diagnostico: "",
                trabajoRealizado: ""
            });

            if (onSuccess) onSuccess(newActividad);
            if (onClose) onClose();

        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Selección de orden */}
                <div>
                    <Label>Orden de Trabajo *</Label>
                    <Select
                        value={formData.ordenId || ""}
                        onChange={(e) => handleChange("ordenId", Number(e.target.value))}
                        disabled={loadingOrders || !!defaultOrderId}
                        className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccione una orden</option>
                        {orders && Array.isArray(orders) && orders
                            .filter(order => order.estado) // Solo órdenes activas
                            .map((order) => (
                                <option key={order.id} value={order.id}>
                                    #{order.workOrderNumber} - {order.equipo?.nombre || 'Sin equipo'}
                                </option>
                            ))}
                    </Select>
                    {errors.ordenId && <p className="text-sm text-red-500 mt-1">{errors.ordenId}</p>}
                </div>

                {/* Selección de tipo de actividad */}
                <div>
                    <Label>Tipo de Actividad *</Label>
                    <Select
                        value={formData.tipoActividadId || ""}
                        onChange={(e) => handleChange("tipoActividadId", Number(e.target.value))}
                        disabled={loadingTipos}
                        className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccione un tipo de actividad</option>
                        {loadingTipos ? (
                            <option disabled>Cargando tipos...</option>
                        ) : (
                            tiposActividad
                                .filter(tipo => tipo.estado)
                                .map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nombre}
                                    </option>
                                ))
                        )}
                    </Select>
                    {errors.tipoActividadId && <p className="text-sm text-red-500 mt-1">{errors.tipoActividadId}</p>}
                </div>

                {/* Diagnóstico */}
                <div>
                    <Label>Diagnóstico *</Label>
                    <div className="relative">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4 pointer-events-none z-10" />
                        <TextArea
                            value={formData.diagnostico}
                            onChange={(e) => handleChange("diagnostico", e.target.value)}
                            placeholder="Describa el diagnóstico técnico encontrado..."
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white min-h-[100px]"
                        />
                    </div>
                    {errors.diagnostico && <p className="text-sm text-red-500 mt-1">{errors.diagnostico}</p>}
                </div>

                {/* Trabajo realizado */}
                <div>
                    <Label>Trabajo Realizado *</Label>
                    <div className="relative">
                        <WrenchScrewdriverIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4 pointer-events-none z-10" />
                        <TextArea
                            value={formData.trabajoRealizado}
                            onChange={(e) => handleChange("trabajoRealizado", e.target.value)}
                            placeholder="Describa el trabajo técnico realizado..."
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white min-h-[100px]"
                        />
                    </div>
                    {errors.trabajoRealizado && <p className="text-sm text-red-500 mt-1">{errors.trabajoRealizado}</p>}
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4">
                    {onClose && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading || loadingTipos || loadingOrders}
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="flex items-center justify-center gap-2"
                        disabled={loading || loadingTipos || loadingOrders}
                    >
                        {loading ? "Registrando..." : "Registrar Actividad"}
                    </Button>
                </div>
            </form>
        </div>
    );
}