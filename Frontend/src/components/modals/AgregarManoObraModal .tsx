"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Combobox } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { CurrencyDollarIcon, UserIcon, HashtagIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            presupuestoId: presupuestoId
        }));
    }, [presupuestoId]);

    // Estado adicional para búsqueda
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredTipos = searchTerm === ""
        ? tipos.filter(t => t.estado)
        : tipos.filter(t => t.estado && t.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value } as FormData));
        if (errors[field as any]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field as any];
                return newErrors;
            });
        }
    };

    const validateFields = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.tipoManoObraId) {
            newErrors.tipoManoObraId = "El tipo de mano de obra es requerido";
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

            toast.success('Detalle de mano de obra registrado con exito', {
                position: "top-center",
                autoClose: 3000,
            });

            // Reset form pero mantenemos el presupuestoId
            setFormData(prev => ({
                ...prev,
                tipoManoObraId: "",
                cantidad: 1
            }));
            setSearchTerm("");

            // Ejecutamos callback de éxito
            if (onSuccess) {
                onSuccess(true);
            }

        } catch (error) {
            console.error("Error:", error);
            toast.error(error instanceof Error ? error.message : 'Error al registrar detalle', {
                position: "top-center",
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className={`relative w-full ${embeddedMode ? '' : 'max-w-[600px] rounded-3xl'} bg-white p-4 dark:bg-gray-900 lg:p-8`}>
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
                <div className={`custom-scrollbar ${embeddedMode ? 'max-h-[40vh]' : 'max-h-[400px]'} overflow-y-auto px-1`}>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5">


                        {/* Tipo de Mano de Obra */}
                        <div className="mb-4">
                            <Label>Tipo de Mano de Obra *</Label>
                            <div className="relative">
                                <Combobox 
                                    value={formData.tipoManoObraId as any} 
                                    onChange={(val) => handleChange("tipoManoObraId", val)}
                                    disabled={loadingTipos}
                                >
                                    <div className="relative">
                                        <div className="relative w-full">
                                            <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                            <Combobox.Input
                                                className={`w-full pl-10 pr-10 py-2 rounded-xl border ${errors['tipoManoObraId' as any] ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all outline-none text-sm`}
                                                displayValue={(val: any) => {
                                                    const t = tipos.find(x => String(x.id) === String(val));
                                                    return t ? `${t.nombre} ($${t.costo})` : "";
                                                }}
                                                placeholder="Buscar servicio..."
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                            />
                                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </Combobox.Button>
                                        </div>

                                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                            {filteredTipos.length === 0 && searchTerm !== "" ? (
                                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-400 text-sm">
                                                    No se encontraron servicios.
                                                </div>
                                            ) : (
                                                filteredTipos.map((tipo) => (
                                                    <Combobox.Option
                                                        key={tipo.id}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2.5 pl-10 pr-4 text-sm ${
                                                                active ? 'bg-brand-500 text-white' : 'text-gray-900 dark:text-gray-300'
                                                            }`
                                                        }
                                                        value={tipo.id}
                                                    >
                                                        {({ selected, active }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                                                    {tipo.nombre} <span className={`ml-2 text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>(${tipo.costo})</span>
                                                                </span>
                                                                {selected && (
                                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-brand-500'}`}>
                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </Combobox.Option>
                                                ))
                                            )}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
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
                                    className={`pl-10 bg-white dark:bg-gray-800 text-black dark:text-white ${errors['cantidad' as any] ? 'border-red-500' : ''}`}
                                />
                            </div>
                            {errors['cantidad' as any] && <p className="text-sm text-red-500 mt-1">{errors['cantidad' as any]}</p>}
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
                            Agregar Mano de Obra
                        </Button>


                        {showNavigation && onNext && (
                            <Button
                                type="button"
                                onClick={onNext}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Siguiente (Ítems)
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );

    if (embeddedMode) {
        return content;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[600px] m-4"
            title="Agregar Mano de Obra"
        >
            {content}
        </Modal>
    );
}