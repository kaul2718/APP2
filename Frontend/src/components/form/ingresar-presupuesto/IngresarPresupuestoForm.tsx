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
import { DocumentTextIcon, CalendarIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { Combobox } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface FormData {
    ordenId: number | null;
    estadoId: number | null;
    descripcion: string;
}

export default function IngresarPresupuestoForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const { createPresupuesto } = usePresupuesto();
    const { orders, loading: loadingOrders } = useOrders();
    const { estados, loading: loadingEstados } = useEstadoPresupuesto();

    // Estado para búsqueda de órdenes
    const [orderSearch, setOrderSearch] = React.useState('');

    // Filtrar órdenes según búsqueda
    const filteredOrders = orderSearch === ''
        ? orders
        : orders.filter(order =>
            `${order.workOrderNumber} ${order.client?.nombre} ${order.client?.apellido}`
                .toLowerCase()
                .includes(orderSearch.toLowerCase())
        );

    const [formData, setFormData] = React.useState<FormData>({
        ordenId: null,
        estadoId: null,
        descripcion: ""
    });

    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    const handleChange = (field: keyof FormData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};
        let isValid = true;

        // Validación de orden
        if (!formData.ordenId) {
            newErrors.ordenId = "⚠️ Debe seleccionar una orden";
            isValid = false;
            setTimeout(() => {
                document.getElementById('order-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('order-select')?.focus();
            }, 100);
        }

        // Validación de estado
        if (!formData.estadoId) {
            newErrors.estadoId = "⚠️ Debe seleccionar un estado";
            isValid = false;
            if (isValid) {
                setTimeout(() => {
                    document.getElementById('estado-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('estado-select')?.focus();
                }, 100);
            }
        }

        // Validación de descripción
        if (!formData.descripcion.trim()) {
            newErrors.descripcion = "⚠️ La descripción es requerida";
            isValid = false;
            if (isValid) {
                setTimeout(() => {
                    document.getElementById('descripcion-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('descripcion-textarea')?.focus();
                }, 100);
            }
        }

        setErrors(newErrors);

        if (!isValid) {
            toast.error('Por favor complete los campos requeridos', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

            toast.success(`✅ Presupuesto creado exitosamente`, {
                position: "top-center",
                autoClose: 3000,
            });

            // Reset del formulario
            setFormData({
                ordenId: null,
                estadoId: null,
                descripcion: ""
            });

            // Redirigir a la página de detalles del presupuesto
            setTimeout(() => router.push(`/ver-presupuesto/${result.id}`), 1500);

        } catch (error) {
            console.error('Error al crear presupuesto:', error);
            toast.error(
                error instanceof Error
                    ? `❌ ${error.message}`
                    : "❌ Error desconocido al crear el presupuesto",
                {
                    position: "top-center",
                    autoClose: 5000,
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ComponentCard title="Crear Nuevo Presupuesto">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                    {/* Selección de orden */}
                    <div className="mb-4">
                        <Label className="mb-1 block">Orden de Trabajo</Label>
                        <Combobox 
                            value={formData.ordenId} 
                            onChange={(value) => handleChange("ordenId", value)}
                            disabled={loadingOrders}
                        >
                            <div className="relative">
                                <div className="relative">
                                    <Combobox.Input
                                        id="order-select"
                                        className={`w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2 pl-10 rounded-lg border ${loadingOrders ? 'opacity-50 cursor-not-allowed' : ''
                                            } ${errors.ordenId ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                                        displayValue={(value) => {
                                            const order = orders.find((o) => o.id === value);
                                            return order
                                                ? `#${order.workOrderNumber} - ${order.client?.nombre} ${order.client?.apellido}`
                                                : '';
                                        }}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                        placeholder={loadingOrders ? 'Cargando órdenes...' : 'Buscar orden...'}
                                        disabled={loadingOrders}
                                    />
                                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>

                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {loadingOrders ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                            Cargando órdenes...
                                        </div>
                                    ) : filteredOrders.length === 0 && orderSearch !== '' ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                            No se encontraron órdenes
                                        </div>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <Combobox.Option
                                                key={order.id}
                                                value={order.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'
                                                    }`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            #{order.workOrderNumber} - {order.client?.nombre} {order.client?.apellido}
                                                        </span>
                                                        {selected && (
                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
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
                        {errors.ordenId && (
                            <p className="text-sm text-red-500 mt-1">{errors.ordenId}</p>
                        )}
                    </div>

                    {/* Selección de estado */}
                    <div className="mb-4">
                        <Label>Estado del Presupuesto</Label>
                        <Select
                            id="estado-select"
                            value={formData.estadoId || ""}
                            onChange={(e) => handleChange("estadoId", Number(e.target.value))}
                            disabled={loadingEstados}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.estadoId ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-black dark:text-white`}
                        >
                            <option value="">Seleccione un estado</option>
                            {estados.map((estado) => (
                                <option key={estado.id} value={estado.id}>
                                    {estado.nombre}
                                </option>
                            ))}
                        </Select>
                        {errors.estadoId && (
                            <p className="text-sm text-red-500 mt-1">{errors.estadoId}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                        <Label>Descripción</Label>
                        <textarea
                            id="descripcion-textarea"
                            value={formData.descripcion}
                            onChange={(e) => handleChange("descripcion", e.target.value)}
                            placeholder="Descripción detallada del presupuesto"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-black dark:text-white`}
                            rows={4}
                        />
                        {errors.descripcion && (
                            <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>
                        )}
                    </div>

                    {/* Botón de envío */}
                    <div>
                        <Button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2"
                            disabled={loading || loadingOrders || loadingEstados}
                        >
                            {loading ? "Creando presupuesto..." : "Crear Presupuesto"}
                        </Button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
}