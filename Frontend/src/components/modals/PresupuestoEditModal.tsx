"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { useOrders } from "@/hooks/useOrders";
import { DocumentTextIcon, CalendarIcon, CheckIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Presupuesto } from "@/hooks/usePresupuesto";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    presupuesto: Presupuesto | null;
    onSave: (updatedPresupuesto: Presupuesto) => void;
}

export default function PresupuestoEditModal({ isOpen, onClose, presupuesto, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { estados, loading: estadosLoading } = useEstadoPresupuesto(); // Cambiado de isLoading a loading
    const { orders, loading: ordersLoading } = useOrders(); // Cambiado de isLoading a loading

    const [editando, setEditando] = React.useState<Presupuesto | null>(null);
    const [cargando, setCargando] = React.useState(false);
    const [errores, setErrores] = React.useState<Record<string, string>>({});

    // Inicializar el estado al abrir el modal
    React.useEffect(() => {
        if (presupuesto) {
            setEditando({ ...presupuesto });
            setErrores({});
        }
    }, [presupuesto]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);

        // Limpiar error si existe
        if (errores[name]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const estadoId = Number(e.target.value);
        const estadoSeleccionado = estados?.find(e => e.id === estadoId);

        if (!estadoSeleccionado) {
            setErrores(prev => ({
                ...prev,
                estadoId: "Estado no válido"
            }));
            return;
        }

        setEditando(prev => prev ? {
            ...prev,
            estadoId,
            estado: estadoSeleccionado
        } : null);

        // Limpiar error si existe
        if (errores.estadoId) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors.estadoId;
                return newErrors;
            });
        }
    };

    const handleOrdenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ordenId = Number(e.target.value);
        setEditando(prev => {
            if (!prev) return null;

            const updated: Presupuesto = {
                ...prev,
                ordenId,
                orden: orders.find(o => o.id === ordenId) || undefined
            };
            return updated;
        });
    };

    const handleCancel = () => {
        onClose();
    };

    const validarFormulario = (): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (!editando) {
            toast.error("No hay datos para guardar");
            return false;
        }

        // Validar estado
        if (!editando.estadoId || !estados?.some(e => e.id === editando.estadoId)) {
            nuevosErrores.estadoId = "Seleccione un estado válido";
        }

        // Validar orden
        if (!editando.ordenId || !orders.some(o => o.id === editando.ordenId)) {
            nuevosErrores.ordenId = "Seleccione una orden válida";
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarFormulario()) return;
        if (!editando || !token || !presupuesto) return;

        setCargando(true);
        try {
            const cambios: Record<string, any> = {};

            // Verificar cambios en cada campo
            if (editando.descripcion !== presupuesto.descripcion) {
                cambios.descripcion = editando.descripcion;
            }

            if (editando.estadoId !== presupuesto.estadoId) {
                cambios.estadoId = editando.estadoId;
            }

            if (editando.ordenId !== presupuesto.ordenId) {
                cambios.ordenId = editando.ordenId;
            }

            if (Object.keys(cambios).length === 0) {
                toast.info("No se realizaron cambios");
                onClose();
                return;
            }

            // Construir el objeto completo con los cambios
            const presupuestoActualizado: Presupuesto = {
                ...presupuesto,
                ...cambios,
                estado: estados?.find(e => e.id === cambios.estadoId) || presupuesto.estado,
                orden: orders.find(o => o.id === cambios.ordenId) || presupuesto.orden
            };

            // Llamar a onSave con el objeto completo
            onSave(presupuestoActualizado);
            console.log("Cambios a enviar:", cambios);
            console.log("Presupuesto actualizado:", presupuestoActualizado);

            onClose();
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
        } finally {
            setCargando(false);
        }
    };

    const getEstadoIcon = () => {
        if (!editando || !estados) return null;
        const estado = estados.find(e => e.id === editando.estadoId);
        switch (estado?.nombre?.toLowerCase()) {
            case 'aprobado':
                return <CheckIcon className="w-5 h-5 text-green-500" />;
            case 'rechazado':
                return <XMarkIcon className="w-5 h-5 text-red-500" />;
            default:
                return <ClockIcon className="w-5 h-5 text-yellow-500" />;
        }
    };

    if (!editando) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            className="max-w-[700px] m-4"
            title={`Editar Presupuesto #${editando.id}`}
        >
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del presupuesto
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del presupuesto. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[400px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>

                            <div>
                                <Label>Fecha de Emisión</Label>
                                <Input
                                    value={new Date(editando.fechaEmision).toLocaleString()}
                                    disabled
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <Label>Descripción</Label>
                                <textarea
                                    name="descripcion"
                                    value={editando.descripcion || ""}
                                    onChange={handleInputChange}
                                    disabled={cargando}
                                    className={`w-full rounded-md border ${errores.descripcion ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50`}
                                    rows={3}
                                />
                                {errores.descripcion && (
                                    <p className="mt-1 text-sm text-red-600">{errores.descripcion}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orden-select">Orden Asociada</Label>
                                <div className="relative">
                                    <select
                                        id="orden-select"
                                        value={editando.ordenId || ""}
                                        onChange={handleOrdenChange}
                                        disabled={cargando || ordersLoading || orders.length === 0}
                                        className={`w-full rounded-md border ${errores.ordenId ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50`}
                                    >
                                        <option value="">Seleccione una orden</option>
                                        {orders.map((orden) => (
                                            <option key={orden.id} value={orden.id}>
                                                #{orden.workOrderNumber} - {orden.client?.nombre} {orden.client?.apellido}
                                            </option>
                                        ))}
                                    </select>
                                    {errores.ordenId && (
                                        <p className="mt-1 text-sm text-red-600">{errores.ordenId}</p>
                                    )}
                                    {editando.ordenId !== presupuesto?.ordenId && (
                                        <div className="mt-2 flex items-start">
                                            <svg
                                                className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="text-sm text-yellow-600">
                                                La orden se actualizará a: <strong>
                                                    #{orders.find(o => o.id === editando.ordenId)?.workOrderNumber}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estado-select">Estado del Presupuesto</Label>
                                <div className="relative">
                                    <div className="flex items-center">
                                        <div className="mr-2">
                                            {getEstadoIcon()}
                                        </div>
                                        <select
                                            id="estado-select"
                                            value={editando.estadoId || ""}
                                            onChange={handleEstadoChange}
                                            disabled={cargando || estadosLoading || estados?.length === 0}
                                            className={`w-full rounded-md border ${errores.estadoId ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50`}
                                        >
                                            <option value="">Seleccione un estado</option>
                                            {estados?.map((estado) => (
                                                <option key={estado.id} value={estado.id}>
                                                    {estado.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errores.estadoId && (
                                        <p className="mt-1 text-sm text-red-600">{errores.estadoId}</p>
                                    )}
                                    {editando.estadoId !== presupuesto?.estadoId && (
                                        <div className="mt-2 flex items-start">
                                            <svg
                                                className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="text-sm text-yellow-600">
                                                El estado se actualizará a: <strong>
                                                    {estados?.find(e => e.id === editando.estadoId)?.nombre}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label>Fecha de creación</Label>
                                <Input
                                    value={new Date(editando.createdAt).toLocaleString()}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label>Última actualización</Label>
                                <Input
                                    value={new Date(editando.updatedAt).toLocaleString()}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={cargando}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={cargando} loading={cargando}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}