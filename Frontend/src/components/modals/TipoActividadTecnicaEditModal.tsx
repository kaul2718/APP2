"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { TipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tipo: TipoActividadTecnica | null;
    onSave: (updatedTipo: TipoActividadTecnica) => void;
}

export default function TipoActividadTecnicaEditModal({ isOpen, onClose, tipo, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [editando, setEditando] = React.useState<TipoActividadTecnica | null>(tipo);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        setEditando(tipo);
        setEstadoModificado(null);
    }, [tipo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
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
            const cambios: Partial<TipoActividadTecnica> = {};

            if (editando.nombre !== tipo?.nombre) cambios.nombre = editando.nombre;
            if (editando.descripcion !== tipo?.descripcion) cambios.descripcion = editando.descripcion;
            if (estadoModificado !== null && estadoModificado !== tipo?.estado)
                cambios.estado = estadoModificado;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica/${editando.id}`, {
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
            setEditando(tipo);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
        }
    };

    if (!editando) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Tipo de Actividad Técnica">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del tipo de actividad
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del tipo de actividad. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[400px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>
                            <div>
                                <Label>Nombre *</Label>
                                <Input
                                    name="nombre"
                                    value={editando.nombre}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Label>Descripción</Label>
                                <TextArea
                                    name="descripcion"
                                    value={editando.descripcion || ""}
                                    onChange={handleInputChange} // Pasa el mismo manejador que para los inputs
                                    disabled={cargando}
                                    rows={4}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {editando.descripcion?.length || 0}/500 caracteres
                                </p>
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
                                    {estadoModificado !== null && estadoModificado !== tipo?.estado && (
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
                            <div className="lg:col-span-2">
                                <Label>Actividades asociadas</Label>
                                <Input
                                    value={editando.actividades?.length || 0}
                                    disabled
                                    suffix="actividades"
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