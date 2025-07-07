"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useTipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";
import { useOrders } from "@/hooks/useOrders";
import { ActividadTecnica } from "@/hooks/useActividadTecnica";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    actividad: ActividadTecnica | null;
    onSave: (updatedActividad: ActividadTecnica) => void;
}

interface OrderActividad {
    id: number;
    workOrderNumber: string;
    // Agrega otras propiedades necesarias de Order que uses
}

interface TipoActividadTecnica {
    id: number;
    nombre: string;
    descripcion?: string | null;
    estado?: boolean;
    // Agrega otras propiedades necesarias
}

export default function ActividadTecnicaEditModal({ isOpen, onClose, actividad, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { tipos: tiposActividad = [], loading: loadingTipos } = useTipoActividadTecnica();
    const { orders } = useOrders();
    const [editando, setEditando] = React.useState<ActividadTecnica | null>(actividad);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);
    const [tipoModificado, setTipoModificado] = React.useState<number | null>(null);
    const [ordenModificada, setOrdenModificada] = React.useState<number | null>(null);

    React.useEffect(() => {
        setEditando(actividad);
        setEstadoModificado(null);
        setTipoModificado(null);
        setOrdenModificada(null);
    }, [actividad]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tipoId = Number(e.target.value);
        setTipoModificado(tipoId);

        setEditando(prev => {
            if (!prev) return null;

            const tipoEncontrado = tiposActividad.find(t => t.id === tipoId);

            return {
                ...prev,
                tipoActividad: tipoEncontrado ? {
                    id: tipoEncontrado.id,
                    nombre: tipoEncontrado.nombre,
                    descripcion: tipoEncontrado.descripcion || null,
                    estado: tipoEncontrado.estado !== undefined ? tipoEncontrado.estado : true
                } : prev.tipoActividad
            };
        });
    };

    const handleOrdenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ordenId = Number(e.target.value);
        setOrdenModificada(ordenId);

        setEditando(prev => {
            if (!prev) return null;

            const ordenEncontrada = orders.find(o => o.id === ordenId);

            if (!ordenEncontrada) return prev;

            return {
                ...prev,
                orden: {
                    id: ordenEncontrada.id,
                    workOrderNumber: ordenEncontrada.workOrderNumber || '' // Valor por defecto
                }
            };
        });
    };

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevoEstado = e.target.value === "activo";
        setEstadoModificado(nuevoEstado);
        setEditando(prev => prev ? { ...prev, estado: nuevoEstado } : null);
    };

    const handleCancel = () => {
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editando || !token) return;

        setCargando(true);
        try {
            const cambios: Partial<ActividadTecnica> = {};

            if (editando.diagnostico !== actividad?.diagnostico) cambios.diagnostico = editando.diagnostico;
            if (editando.trabajoRealizado !== actividad?.trabajoRealizado) cambios.trabajoRealizado = editando.trabajoRealizado;
            if (estadoModificado !== null && estadoModificado !== actividad?.estado)
                cambios.estado = estadoModificado;
            if (tipoModificado !== null && tipoModificado !== actividad?.tipoActividad.id)
                cambios.tipoActividadId = tipoModificado;
            if (ordenModificada !== null && ordenModificada !== actividad?.orden.id)
                cambios.ordenId = ordenModificada;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/${editando.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(cambios),
                });

                if (!response.ok) throw new Error(`Error al actualizar: ${response.status}`);

                const data = await response.json();
                onSave(data);
                toast.success("Cambios guardados correctamente");
                onClose();
            } else {
                toast.info("No se realizaron cambios");
            }
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
            setEditando(actividad);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
            setTipoModificado(null);
            setOrdenModificada(null);
        }
    };

    if (!editando) return null;

    const fechaCreacion = format(new Date(editando.createdAt), 'PPPpp', { locale: es });
    const fechaActualizacion = format(new Date(editando.updatedAt), 'PPPpp', { locale: es });
    const fechaActividad = format(new Date(editando.fecha), 'PPPpp', { locale: es });

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[800px] m-4" title="Editar Actividad Técnica">
            <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información de la actividad técnica
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos de la actividad técnica. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>
                            <div>
                                <Label>Fecha de Actividad</Label>
                                <Input value={fechaActividad} disabled />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orden-select">Orden de Trabajo *</Label>
                                <div className="relative">
                                    <select
                                        id="orden-select"
                                        value={editando.orden.id}
                                        onChange={handleOrdenChange}
                                        disabled={cargando || orders.length === 0}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                        required
                                    >
                                        <option value="">Seleccione una orden</option>
                                        {orders.map((order) => (
                                            <option key={order.id} value={order.id}>
                                                ORD-{order.workOrderNumber} - {order.client ? `${order.client.nombre} ${order.client.apellido}` : 'Sin cliente'}
                                            </option>
                                        ))}
                                    </select>
                                    {ordenModificada !== null && ordenModificada !== actividad?.orden.id && (
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
                                                La orden se actualizará a: <strong>#{orders.find(o => o.id === ordenModificada)?.workOrderNumber}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tipo-select">Tipo de Actividad *</Label>
                                <div className="relative">
                                    <select
                                        id="tipo-select"
                                        value={editando?.tipoActividad?.id || ""}
                                        onChange={handleTipoChange}
                                        disabled={cargando || loadingTipos}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                        required
                                    >
                                        <option value="">Seleccione un tipo</option>
                                        {loadingTipos ? (
                                            <option disabled>Cargando tipos...</option>
                                        ) : (
                                            tiposActividad.map((tipo) => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {tipoModificado !== null && tipoModificado !== actividad?.tipoActividad.id && (
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
                                                El tipo se actualizará a: <strong>{tiposActividad.find(t => t.id === tipoModificado)?.nombre}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <Label>Diagnóstico *</Label>
                                <TextArea
                                    name="diagnostico"
                                    value={editando.diagnostico}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <Label>Trabajo Realizado *</Label>
                                <TextArea
                                    name="trabajoRealizado"
                                    value={editando.trabajoRealizado}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div>
                                <Label>Fecha de creación</Label>
                                <Input value={fechaCreacion} disabled />
                            </div>
                            <div>
                                <Label>Última actualización</Label>
                                <Input value={fechaActualizacion} disabled />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estado-select">Estado</Label>
                                <div className="relative">
                                    <select
                                        id="estado-select"
                                        value={editando.estado ? "activo" : "inactivo"}
                                        onChange={handleEstadoChange}
                                        disabled={cargando}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                    {estadoModificado !== null && estadoModificado !== actividad?.estado && (
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
                                                El estado se actualizará a: <strong>{estadoModificado ? "Activo" : "Inactivo"}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
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