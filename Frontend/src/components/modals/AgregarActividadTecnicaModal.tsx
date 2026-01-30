'use client';
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { DocumentTextIcon, PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useTipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";
import { useActividadTecnica } from "@/hooks/useActividadTecnica";
import TextArea from "@/components/form/input/TextArea";

interface FormData {
    ordenId: number | null;
    tipoActividadId: number | null;
    diagnostico: string;
    trabajoRealizado: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (id: number) => void;
    orderId?: number | null;
}

export default function AgregarActividadTecnicaModal({
    isOpen,
    onClose,
    onSuccess,
    orderId = null
}: Props) {
    const [formData, setFormData] = useState<FormData>({
        ordenId: orderId,
        tipoActividadId: null,
        diagnostico: "",
        trabajoRealizado: ""
    });

    const { data: session } = useSession();
    const { createActividadTecnica, loading: actividadLoading } = useActividadTecnica();
    const { orders, loading: loadingOrders } = useOrders();
    const { tipos: tiposActividad, loading: loadingTipos } = useTipoActividadTecnica();
    const [errors, setErrors] = React.useState<Partial<FormData>>({});

    const resetForm = () => {
        setFormData({
            ordenId: orderId,
            tipoActividadId: null,
            diagnostico: "",
            trabajoRealizado: ""
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ordenId: orderId
        }));
    }, [orderId]);

    const handleChange = (field: keyof FormData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};
        let isValid = true;

        if (!formData.ordenId) {
            newErrors.ordenId = "⚠️ Debe seleccionar una orden";
            isValid = false;
        }

        if (!formData.tipoActividadId) {
            newErrors.tipoActividadId = "⚠️ Debe seleccionar un tipo de actividad";
            isValid = false;
        }

        if (!formData.diagnostico.trim()) {
            newErrors.diagnostico = "⚠️ El diagnóstico es requerido";
            isValid = false;
        } else if (formData.diagnostico.trim().length < 10) {
            newErrors.diagnostico = "⚠️ El diagnóstico debe tener al menos 10 caracteres";
            isValid = false;
        }

        if (!formData.trabajoRealizado.trim()) {
            newErrors.trabajoRealizado = "⚠️ El trabajo realizado es requerido";
            isValid = false;
        } else if (formData.trabajoRealizado.trim().length < 10) {
            newErrors.trabajoRealizado = "⚠️ El trabajo realizado debe tener al menos 10 caracteres";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent, action: 'add-another' | 'finish') => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        try {
            const actividadData = {
                ordenId: Number(formData.ordenId),
                tipoActividadId: Number(formData.tipoActividadId),
                diagnostico: formData.diagnostico,
                trabajoRealizado: formData.trabajoRealizado
            };

            const result = await createActividadTecnica(actividadData);

            if (!result?.id) {
                throw new Error("No se pudo crear la actividad técnica. Intente nuevamente.");
            }

            toast.success(`✅ Actividad técnica creada exitosamente`, {
                position: "top-center",
                autoClose: 3000,
            });

            if (onSuccess) onSuccess(result.id);

            if (action === 'add-another') {
                resetForm();
            } else {
                handleClose();
            }

        } catch (error) {
            toast.error(
                error instanceof Error
                    ? `❌ ${error.message}`
                    : "❌ Error desconocido al crear la actividad técnica",
                {
                    position: "top-center",
                    autoClose: 5000,
                }
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-3xl mx-4"
            closeButtonClassName="top-6 right-6"
        >
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
                {/* Título agregado aquí */}
                <div className="px-6 pt-4 pb-2">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
                        Agregar Actividad Técnica
                    </h2>
                </div>

                <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6">
                    <div className="grid grid-cols-1 gap-y-4">
                        {/* Selección de orden */}
                        <div className="mb-3">
                            <Label className="mb-1 block">Orden de Trabajo *</Label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="order-select"
                                    readOnly
                                    value={(() => {
                                        const order = orders.find((o) => o.id === formData.ordenId);
                                        return order
                                            ? `#${order.workOrderNumber} - ${order.equipo?.nombre || 'Sin equipo'}`
                                            : '';
                                    })()}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                                    disabled
                                />
                            </div>
                            {errors.ordenId && (
                                <p className="text-sm text-red-500 mt-1">{errors.ordenId}</p>
                            )}
                        </div>

                        {/* Tipo de actividad */}
                        <div className="mb-3">
                            <Label>Tipo de Actividad *</Label>
                            <select
                                value={formData.tipoActividadId || ""}
                                onChange={(e) => handleChange("tipoActividadId", Number(e.target.value))}
                                disabled={loadingTipos}
                                className={`w-full px-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.tipoActividadId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                            </select>
                            {errors.tipoActividadId && (
                                <p className="text-sm text-red-500 mt-1">{errors.tipoActividadId}</p>
                            )}
                        </div>

                        {/* Diagnóstico */}
                        <div className="mb-3">
                            <Label>Diagnóstico *</Label>
                            <div className="relative">
                                <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4" />
                                <textarea
                                    id="diagnostico-textarea"
                                    value={formData.diagnostico}
                                    onChange={(e) => handleChange("diagnostico", e.target.value)}
                                    placeholder="Describa el diagnóstico técnico encontrado..."
                                    className={`w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.diagnostico ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    rows={4}
                                />
                            </div>
                            {errors.diagnostico && (
                                <p className="text-sm text-red-500 mt-1">{errors.diagnostico}</p>
                            )}
                        </div>

                        {/* Trabajo realizado */}
                        <div className="mb-3">
                            <Label>Trabajo Realizado *</Label>
                            <div className="relative">
                                <WrenchScrewdriverIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4" />
                                <textarea
                                    id="trabajo-textarea"
                                    value={formData.trabajoRealizado}
                                    onChange={(e) => handleChange("trabajoRealizado", e.target.value)}
                                    placeholder="Describa el trabajo técnico realizado..."
                                    className={`w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.trabajoRealizado ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    rows={4}
                                />
                            </div>
                            {errors.trabajoRealizado && (
                                <p className="text-sm text-red-500 mt-1">{errors.trabajoRealizado}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 mt-4 px-6 pb-6">
                    {/* Cancelar */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={actividadLoading}
                        className="w-1/2 sm:w-auto min-w-[140px]"
                    >
                        Cancelar
                    </Button>

                    {/* Grupo de botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-center">
                        {/* Finalizar */}
                        <Button
                            type="button"
                            variant="primary"
                            onClick={(e) => handleSubmit(e, 'finish')}
                            disabled={actividadLoading || loadingOrders || loadingTipos}
                            loading={actividadLoading}
                            className="w-1/2 sm:w-auto min-w-[140px]"
                        >
                            Finalizar
                        </Button>

                        {/* Agregar Otra */}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={(e) => handleSubmit(e, 'add-another')}
                            disabled={actividadLoading || loadingOrders || loadingTipos}
                            loading={actividadLoading}
                            className="w-1/2 sm:w-auto min-w-[140px] bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 px-4 py-2 rounded-md transition duration-150"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Agregar Otra
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}