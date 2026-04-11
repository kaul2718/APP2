'use client';
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import { DocumentTextIcon, PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useTipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";
import { useActividadTecnica } from "@/hooks/useActividadTecnica";

interface FormData {
    ordenId: number | null;
    tipoActividadId: number | null;
    diagnostico: string;
    trabajoRealizado: string;
}

interface FormErrors {
    ordenId?: string;
    tipoActividadId?: string;
    diagnostico?: string;
    trabajoRealizado?: string;
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

    const { createActividadTecnica, loading: actividadLoading } = useActividadTecnica();
    const { tipos: tiposActividad, loading: loadingTipos } = useTipoActividadTecnica();
    const [errors, setErrors] = React.useState<FormErrors>({});

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
        const newErrors: FormErrors = {};
        let isValid = true;

        if (!formData.ordenId) {
            newErrors.ordenId = "Debe seleccionar una orden";
            isValid = false;
        }

        if (!formData.tipoActividadId) {
            newErrors.tipoActividadId = "Debe seleccionar un tipo de actividad";
            isValid = false;
        }

        if (!formData.diagnostico.trim()) {
            newErrors.diagnostico = "El diagnostico es requerido";
            isValid = false;
        } else if (formData.diagnostico.trim().length < 10) {
            newErrors.diagnostico = "El diagnostico debe tener al menos 10 caracteres";
            isValid = false;
        }

        if (!formData.trabajoRealizado.trim()) {
            newErrors.trabajoRealizado = "El trabajo realizado es requerido";
            isValid = false;
        } else if (formData.trabajoRealizado.trim().length < 10) {
            newErrors.trabajoRealizado = "El trabajo realizado debe tener al menos 10 caracteres";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (action: 'add-another' | 'finish') => {

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

            toast.success('Actividad tecnica creada exitosamente', {
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
            toast.error(error instanceof Error ? error.message : 'Error desconocido al crear la actividad tecnica', {
                position: "top-center",
                autoClose: 5000,
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Agregar actividad tecnica"
            className="max-w-3xl mx-4"
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
                            <Label htmlFor="order-select" className="mb-1 block">Orden de Trabajo <span aria-hidden="true">*</span></Label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="order-select"
                                    readOnly
                                    value={formData.ordenId ? `#${formData.ordenId}` : ''}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                                    disabled
                                    aria-required="true"
                                />
                            </div>
                            {errors.ordenId && (
                                <p role="alert" className="text-sm text-red-500 mt-1">{errors.ordenId}</p>
                            )}
                        </div>

                        {/* Tipo de actividad */}
                        <div className="mb-3">
                            <Label htmlFor="tipo-actividad-select">Tipo de Actividad <span aria-hidden="true">*</span></Label>
                            <select
                                id="tipo-actividad-select"
                                value={formData.tipoActividadId || ""}
                                onChange={(e) => handleChange("tipoActividadId", Number(e.target.value))}
                                disabled={loadingTipos}
                                aria-required="true"
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
                                <p role="alert" className="text-sm text-red-500 mt-1">{errors.tipoActividadId}</p>
                            )}
                        </div>

                        {/* Diagnóstico */}
                        <div className="mb-3">
                            <Label htmlFor="diagnostico-textarea">Diagnostico <span aria-hidden="true">*</span></Label>
                            <div className="relative">
                                <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4" />
                                <textarea
                                    id="diagnostico-textarea"
                                    value={formData.diagnostico}
                                    onChange={(e) => handleChange("diagnostico", e.target.value)}
                                    placeholder="Describa el diagnóstico técnico encontrado..."
                                    className={`w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.diagnostico ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    rows={4}
                                    aria-required="true"
                                />
                            </div>
                            {errors.diagnostico && (
                                <p role="alert" className="text-sm text-red-500 mt-1">{errors.diagnostico}</p>
                            )}
                        </div>

                        {/* Trabajo realizado */}
                        <div className="mb-3">
                            <Label htmlFor="trabajo-textarea">Trabajo Realizado <span aria-hidden="true">*</span></Label>
                            <div className="relative">
                                <WrenchScrewdriverIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4" />
                                <textarea
                                    id="trabajo-textarea"
                                    value={formData.trabajoRealizado}
                                    onChange={(e) => handleChange("trabajoRealizado", e.target.value)}
                                    placeholder="Describa el trabajo técnico realizado..."
                                    className={`w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.trabajoRealizado ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    rows={4}
                                    aria-required="true"
                                />
                            </div>
                            {errors.trabajoRealizado && (
                                <p role="alert" className="text-sm text-red-500 mt-1">{errors.trabajoRealizado}</p>
                            )}
                        </div>
                    </div>
                </div>

                <p className="px-6 pb-2 text-xs text-gray-500 dark:text-gray-400">* Campo obligatorio</p>

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
                            onClick={() => void handleSubmit('finish')}
                            disabled={actividadLoading || loadingTipos}
                            loading={actividadLoading}
                            className="w-1/2 sm:w-auto min-w-[140px]"
                        >
                            Finalizar
                        </Button>

                        {/* Agregar Otra */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleSubmit('add-another')}
                            disabled={actividadLoading || loadingTipos}
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