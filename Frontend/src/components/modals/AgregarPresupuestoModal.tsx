'use client';
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { CheckCircleIcon, DocumentTextIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import AgregarManoObraModal from "./AgregarManoObraModal ";
import AgregarItemsPresupuestoModal from "./AgregarItemsPresupuestoModal";

type WizardStep = 'presupuesto' | 'manoObra' | 'items';

interface FormData {
    ordenId: number | null;
    estadoId: number | null;
    descripcion: string;
}

interface FormErrors {
    ordenId?: string;
    estadoId?: string;
    descripcion?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (id: number) => void;
    orderId?: number | null;
}

export default function AgregarPresupuestoModal({
    isOpen,
    onClose,
    onSuccess,
    orderId = null
}: Props) {
    const [currentStep, setCurrentStep] = useState<WizardStep>('presupuesto');
    const [presupuestoId, setPresupuestoId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({
        ordenId: orderId,
        estadoId: null,
        descripcion: ""
    });
    const [itemsAdded, setItemsAdded] = useState({
        manoObra: false,
        items: false
    });

    const { data: session } = useSession();
    const { createPresupuesto } = usePresupuesto();
    const { orders, loading: loadingOrders } = useOrders();
    const { estados, loading: loadingEstados } = useEstadoPresupuesto();

    const handleStepClick = (step: WizardStep, index: number) => {
        // Solo permitir navegación si:
        // 1. Es un paso anterior al actual
        // 2. O si ya hemos creado el presupuesto (para los pasos 2 y 3)
        const currentIndex = ['presupuesto', 'manoObra', 'items'].indexOf(currentStep);

        if (index < currentIndex ||
            (index > 0 && presupuestoId !== null) ||
            (index === 0)) {
            setCurrentStep(step);
        } else if (index === 1 && presupuestoId === null) {
            toast.warning("Debes completar los datos básicos primero", {
                position: "top-center",
                autoClose: 3000,
            });
        }
    };
    const handleClose = () => {
        setCurrentStep('presupuesto');
        setPresupuestoId(null);
        setFormData({
            ordenId: orderId,
            estadoId: null,
            descripcion: ""
        });
        setItemsAdded({
            manoObra: false,
            items: false
        });
        onClose();
    };

    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ordenId: orderId
        }));
    }, [orderId]);

    React.useEffect(() => {
        if (estados.length > 0 && formData.estadoId === null) {
            const estadoPendiente = estados.find(e => e.nombre.toLowerCase() === 'pendiente');
            if (estadoPendiente) {
                setFormData(prev => ({ ...prev, estadoId: estadoPendiente.id }));
            }
        }
    }, [estados, formData.estadoId]);

    const [errors, setErrors] = React.useState<FormErrors>({});
    const [loading, setLoading] = React.useState(false);

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

        if (!formData.estadoId) {
            newErrors.estadoId = "Debe seleccionar un estado";
            isValid = false;
        }

        if (!formData.descripcion.trim()) {
            newErrors.descripcion = "La descripcion es requerida";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmitPresupuesto = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        setLoading(true);

        try {
            const presupuestoData = {
                ordenId: Number(formData.ordenId),
                estadoId: Number(formData.estadoId),
                descripcion: formData.descripcion
            };

            const result = await createPresupuesto(presupuestoData);

            if (!result?.id) {
                throw new Error("No se pudo crear el presupuesto. Intente nuevamente.");
            }

            toast.success('Presupuesto base creado exitosamente', {
                position: "top-center",
                autoClose: 3000,
            });

            setPresupuestoId(result.id);
            setCurrentStep('manoObra');

        } catch (error) {
            //console.error('Error al crear presupuesto:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Error desconocido al crear el presupuesto',
                {
                    position: "top-center",
                    autoClose: 5000,
                }
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteWizard = () => {
        if (!itemsAdded.manoObra && !itemsAdded.items) {
            toast.warning('No has agregado ítems de mano de obra ni de presupuesto', {
                position: "top-center",
                autoClose: 5000,
            });
            return;
        }

        toast.success('Presupuesto completado con todos los detalles');
        if (presupuestoId && onSuccess) {
            onSuccess(presupuestoId);
        }
        handleClose();
    };

    const handleAddManoObra = () => {
        setItemsAdded(prev => ({ ...prev, manoObra: true }));
        //toast.success("Mano de obra agregada");
    };

    const handleAddItem = () => {
        setItemsAdded(prev => ({ ...prev, items: true }));
        //toast.success("Ítem agregado");
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'presupuesto':
                return (
                    <form onSubmit={handleSubmitPresupuesto} className="flex flex-col">
                        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-4">
                            <div className="grid grid-cols-1 gap-y-5">
                                {/* Selección de orden */}
                                <div className="mb-4">
                                    <Label htmlFor="order-select" className="mb-1 block">Orden de Trabajo <span aria-hidden="true">*</span></Label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="order-select"
                                            readOnly
                                            value={(() => {
                                                const order = orders.find((o) => o.id === formData.ordenId);
                                                return order
                                                    ? `#${order.workOrderNumber} - ${order.client?.nombre} ${order.client?.apellido}`
                                                    : '';
                                            })()}
                                            className="w-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                                            disabled
                                            aria-required="true"
                                        />
                                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                    {errors.ordenId && (
                                        <p role="alert" className="text-sm text-red-500 mt-1">{errors.ordenId}</p>
                                    )}
                                </div>

                                {/* Estado del presupuesto */}
                                <div className="mb-4">
                                    <Label htmlFor="estado-select">Estado del Presupuesto <span aria-hidden="true">*</span></Label>
                                    <div className="relative">
                                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <input
                                            type="text"
                                            id="estado-select"
                                            value={(() => {
                                                const estado = estados.find(e => e.id === formData.estadoId);
                                                return estado ? estado.nombre : 'Pendiente';
                                            })()}
                                            disabled
                                            className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="mb-4">
                                    <Label htmlFor="descripcion-textarea">Descripcion <span aria-hidden="true">*</span></Label>
                                    <div className="relative">
                                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-4" />
                                        <textarea
                                            id="descripcion-textarea"
                                            value={formData.descripcion}
                                            onChange={(e) => handleChange("descripcion", e.target.value)}
                                            placeholder="Descripción detallada del presupuesto"
                                            className={`w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            rows={4}
                                        />
                                    </div>
                                    {errors.descripcion && (
                                        <p role="alert" className="text-sm text-red-500 mt-1">{errors.descripcion}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">* Campo obligatorio</p>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-6 px-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="submit"
                                disabled={loading || loadingOrders || loadingEstados}
                                loading={loading}
                                className="w-full sm:w-auto"
                            >
                                Siguiente (Mano de Obra)
                            </Button>

                            <Button
                                type="button"
                                onClick={handleCompleteWizard}
                                disabled={loading}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md transition duration-150"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                Finalizar Presupuesto
                            </Button>
                        </div>

                    </form>
                );

            case 'manoObra':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto px-4">
                            <AgregarManoObraModal
                                isOpen={true}
                                onClose={() => setCurrentStep('presupuesto')}
                                onSuccess={(added) => {
                                    if (added) handleAddManoObra();
                                }}
                                onNext={() => setCurrentStep('items')}
                                onBack={() => setCurrentStep('presupuesto')}
                                presupuestoId={presupuestoId!}
                                embeddedMode={true}
                                showNavigation={true}
                            />
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleCompleteWizard}
                                className="w-full"
                            >
                                Finalizar Presupuesto
                            </Button>
                        </div>
                    </div>
                );

            case 'items':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto px-4">
                            <AgregarItemsPresupuestoModal
                                isOpen={true}
                                onClose={() => setCurrentStep('manoObra')}
                                onSuccess={(added) => {
                                    if (added) {
                                        handleAddItem();
                                    }
                                }}
                                onBack={() => setCurrentStep('manoObra')}
                                presupuestoId={presupuestoId!}
                                embeddedMode={true}
                                showNavigation={true}
                            />
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleCompleteWizard}
                                className="w-full"
                            >
                                Finalizar Presupuesto
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-3xl mx-4"
            title={getStepTitle(currentStep)}
        >
            {/* Barra de progreso mejorada */}
            <div className="px-6 pt-2 pb-4">
                <div className="relative">
                    <div className="flex items-center justify-between">
                        {['presupuesto', 'manoObra', 'items'].map((step, index) => (
                            <React.Fragment key={step}>
                                <button
                                    type="button"
                                    className={`flex flex-col items-center group ${currentStep === step ? 'text-primary font-bold' : 'text-gray-500'}`}
                                    onClick={() => handleStepClick(step as WizardStep, index)}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                            ${currentStep === step ? 'bg-primary text-white border-2 border-primary' :
                                            index < ['presupuesto', 'manoObra', 'items'].indexOf(currentStep) ?
                                                'bg-green-500 text-white border-2 border-green-500 cursor-pointer' :
                                                'bg-white border-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600 cursor-pointer'}
                            group-hover:border-primary transition-colors`}>
                                        {index + 1}
                                    </div>
                                    <span className="text-xs mt-2 font-medium group-hover:text-primary transition-colors">
                                        {step === 'presupuesto' ? 'Datos Básicos' :
                                            step === 'manoObra' ? 'Mano de Obra' : 'Ítems'}
                                    </span>
                                </button>
                                {index < 2 && (
                                    <div className={`flex-1 h-1 mx-2 ${index < ['presupuesto', 'manoObra', 'items'].indexOf(currentStep) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contenido del paso actual */}
            <div className="flex flex-col" style={{ minHeight: '400px' }}>
                {renderStep()}
            </div>
        </Modal>
    );
}

const getStepTitle = (step: WizardStep): string => {
    switch (step) {
        case 'presupuesto': return 'Crear Presupuesto - Paso 1 de 3';
        case 'manoObra': return 'Agregar Mano de Obra - Paso 2 de 3';
        case 'items': return 'Agregar Ítems - Paso 3 de 3';
        default: return 'Crear Presupuesto';
    }
};