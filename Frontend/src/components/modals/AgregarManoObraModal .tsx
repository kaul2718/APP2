"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Select } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { CurrencyDollarIcon, UserIcon, HashtagIcon } from "@heroicons/react/24/outline";
import { useTipoManoObra } from "@/hooks/useTipoManoObra";

interface FormData {
    presupuestoId: number | string;
    tipoManoObraId: number | string;
    cantidad: number | string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (added: boolean) => void;
    onNext?: () => void;
    onBack?: () => void;
    presupuestoId: number;
    embeddedMode?: boolean;
    showNavigation?: boolean;
}

export default function AgregarManoObraModal({
    isOpen,
    onClose,
    onSuccess,
    onNext,
    onBack,
    presupuestoId,
    embeddedMode = false,
    showNavigation = true
}: Props) {
    const { data: session } = useSession();
    const { tipos, loading: loadingTipos } = useTipoManoObra();

    const [formData, setFormData] = React.useState<FormData>({
        presupuestoId: presupuestoId,
        tipoManoObraId: "",
        cantidad: 1
    });

    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            presupuestoId: presupuestoId
        }));
    }, [presupuestoId]);

    const handleChange = (field: keyof FormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.tipoManoObraId) {
            newErrors.tipoManoObraId = "⚠️ El tipo de mano de obra es requerido";
        }

        if (!formData.cantidad) {
            newErrors.cantidad = "⚠️ La cantidad es requerida";
        } else if (Number(formData.cantidad) <= 0) {
            newErrors.cantidad = "⚠️ La cantidad debe ser mayor a 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateFields()) {
            setLoading(false);
            toast.error('Por favor complete los campos requeridos', {
                position: "top-center",
                autoClose: 5000,
            });
            return;
        }

        try {
            const payload = {
                presupuestoId: Number(formData.presupuestoId),
                tipoManoObraId: Number(formData.tipoManoObraId),
                cantidad: Number(formData.cantidad)
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.message || "Error al registrar detalle");
            }

            toast.success("✅ Detalle de mano de obra registrado con éxito", {
                position: "top-center",
                autoClose: 3000,
            });

            // Reset form pero mantenemos el presupuestoId
            setFormData(prev => ({
                ...prev,
                tipoManoObraId: "",
                cantidad: 1
            }));

            // Ejecutamos callback de éxito
            if (onSuccess) {
                onSuccess(true);
            }

        } catch (error) {
            console.error("Error:", error);
            toast.error(error instanceof Error ? `❌ ${error.message}` : "❌ Error al registrar detalle", {
                position: "top-center",
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[600px] m-4"
            title={embeddedMode ? "Agregar Mano de Obra" : "Agregar Mano de Obra"}
        >
            <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                {!embeddedMode && (
                    <>
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Agregar Mano de Obra
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                            Complete los campos para agregar mano de obra al presupuesto.
                        </p>
                    </>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[calc(100vh-250px)] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                            {/* ID Presupuesto (solo lectura) */}
                            <div className="mb-4">
                                <Label>ID del Presupuesto</Label>
                                <div className="relative">
                                    <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        value={formData.presupuestoId}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Tipo de Mano de Obra */}
                            <div className="mb-4">
                                <Label>Tipo de Mano de Obra *</Label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Select
                                        value={formData.tipoManoObraId}
                                        onChange={(e) => handleChange("tipoManoObraId", e.target.value)}
                                        className={`w-full pl-10 pr-3 py-2 rounded-md border ${errors.tipoManoObraId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
                                        disabled={loadingTipos}
                                    >
                                        <option value="">Seleccione un tipo</option>
                                        {tipos
                                            .filter(tipo => tipo.estado)
                                            .map((tipo) => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre} (${tipo.costo})
                                                </option>
                                            ))}
                                    </Select>
                                </div>
                                {errors.tipoManoObraId && <p className="text-sm text-red-500 mt-1">{errors.tipoManoObraId}</p>}
                            </div>

                            {/* Cantidad */}
                            <div className="mb-4">
                                <Label>Cantidad *</Label>
                                <div className="relative">
                                    <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        type="number"
                                        min="1"
                                        step={1}
                                        value={formData.cantidad}
                                        onChange={(e) => handleChange("cantidad", e.target.value)}
                                        placeholder="Cantidad"
                                        className={`pl-10 bg-white dark:bg-gray-800 text-black dark:text-white ${errors.cantidad ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                {errors.cantidad && <p className="text-sm text-red-500 mt-1">{errors.cantidad}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between gap-4 mt-6">
                        <div>
                            {showNavigation && onBack && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onBack}
                                    disabled={loading}
                                >
                                    Atrás
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={loading || loadingTipos}
                                loading={loading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Agregar
                            </Button>


                            {showNavigation && onNext && (
                                <Button
                                    type="button"
                                    onClick={onNext}
                                    disabled={loading}
                                >
                                    Siguiente
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}