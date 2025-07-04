"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { usePartes } from "@/hooks/usePartes";
import { Repuesto } from "@/hooks/useRepuesto";
import { CurrencyDollarIcon, TagIcon, CogIcon, DocumentTextIcon, CubeIcon } from "@heroicons/react/24/outline";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    repuesto: Repuesto | null;
    onSave: (updatedRepuesto: Repuesto) => void;
}

export default function RepuestoEditModal({ isOpen, onClose, repuesto, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { partes } = usePartes();
    const [editando, setEditando] = React.useState<Repuesto | null>(repuesto);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);
    const [parteModificada, setParteModificada] = React.useState<number | null>(null);

    React.useEffect(() => {
        setEditando(repuesto);
        setEstadoModificado(null);
        setParteModificada(null);
    }, [repuesto]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setEditando(prev => prev ? { ...prev, precioVenta: isNaN(value) ? 0 : value } : null);
    };

    const handleParteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const parteId = Number(e.target.value);
        setParteModificada(parteId);
        setEditando(prev => prev ? {
            ...prev,
            parte: partes.find(p => p.id === parteId) ? {
                id: parteId,
                nombre: partes.find(p => p.id === parteId)!.nombre
            } : null
        } : null);
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
            const cambios: Partial<Repuesto> = {};

            if (editando.codigo !== repuesto?.codigo) cambios.codigo = editando.codigo;
            if (editando.nombre !== repuesto?.nombre) cambios.nombre = editando.nombre;
            if (editando.descripcion !== repuesto?.descripcion) cambios.descripcion = editando.descripcion;
            if (editando.precioVenta !== repuesto?.precioVenta) cambios.precioVenta = editando.precioVenta;
            if (estadoModificado !== null && estadoModificado !== repuesto?.estado)
                cambios.estado = estadoModificado;
            if (parteModificada !== null && parteModificada !== repuesto?.parte?.id)
                cambios.parteId = parteModificada;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/${editando.id}`, {
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
            setEditando(repuesto);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
            setParteModificada(null);
        }
    };

    if (!editando) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Repuesto">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del repuesto
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del repuesto. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>
                            <div>
                                <Label>Código *</Label>
                                <div className="relative">
                                    <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        name="codigo"
                                        value={editando.codigo}
                                        onChange={handleInputChange}
                                        required
                                        disabled={cargando}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Nombre *</Label>
                                <div className="relative">
                                    <CogIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        name="nombre"
                                        value={editando.nombre}
                                        onChange={handleInputChange}
                                        required
                                        disabled={cargando}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Precio de Venta *</Label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        type="number"
                                        min="0"
                                        step={0.01}
                                        name="precioVenta"
                                        value={editando.precioVenta}
                                        onChange={handlePrecioChange}
                                        required
                                        disabled={cargando}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <Label>Descripción *</Label>
                                <div className="relative">
                                    <DocumentTextIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                    <textarea
                                        name="descripcion"
                                        value={editando.descripcion}
                                        onChange={handleTextareaChange}
                                        required
                                        disabled={cargando}
                                        className="w-full pl-10 p-2 border rounded-md bg-white dark:bg-gray-800 text-black dark:text-white min-h-[100px]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parte-select">Parte</Label>
                                <div className="relative">
                                    <CubeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <select
                                        id="parte-select"
                                        value={editando.parte?.id || ""}
                                        onChange={handleParteChange}
                                        disabled={cargando || partes.length === 0}
                                        className="w-full pl-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="">Seleccione una parte</option>
                                        {partes.map((parte) => (
                                            <option key={parte.id} value={parte.id}>
                                                {parte.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {parteModificada !== null && parteModificada !== repuesto?.parte?.id && (
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
                                                La parte se actualizará a: <strong>{partes.find(p => p.id === parteModificada)?.nombre}</strong>
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
                                    {estadoModificado !== null && estadoModificado !== repuesto?.estado && (
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