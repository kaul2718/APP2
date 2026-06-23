"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Casillero } from "@/hooks/useCasillero";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    casillero: Casillero | null;
    onSave: (updatedCasillero: Casillero) => void;
}

export default function CasilleroEditModal({ isOpen, onClose, casillero, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [editando, setEditando] = React.useState<Casillero | null>(casillero);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        setEditando(casillero);
        setEstadoModificado(null);
    }, [casillero]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleSubmit = async () => {
        if (!editando || !token) return;

        // Validar que no se desactive un casillero ocupado
        if (estadoModificado === false && editando.situacion === 'Ocupado') {
            toast.error("No se puede desactivar un casillero ocupado");
            return;
        }

        setCargando(true);

        try {
            const cambios: Partial<Casillero> = {};

            if (editando.codigo !== casillero?.codigo) cambios.codigo = editando.codigo;
            if (editando.descripcion !== casillero?.descripcion) cambios.descripcion = editando.descripcion;
            if (estadoModificado !== null && estadoModificado !== casillero?.estado) {
                cambios.estado = estadoModificado;
            }

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${editando.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(cambios),
                });

                // Manejo mejorado de errores
                if (!response.ok) {
                    let errorMessage = `Error ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch {
                        // Si no se puede parsear el body de error, se mantiene el mensaje por status.
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                onSave(data);
                toast.success("Cambios guardados correctamente");
                onClose();
            } else {
                toast.info("No se realizaron cambios");
            }
        } catch (error) {
            console.error("Error al guardar cambios:", error);

            // Mensaje de error más específico
            const errorMessage = error instanceof Error
                ? error.message.includes("400")
                    ? "Datos inválidos enviados al servidor"
                    : error.message
                : "Error desconocido al guardar cambios";

            toast.error(errorMessage);

            // Restaurar los valores originales
            setEditando(casillero);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
        }
    };

    const idInputId = React.useId();
    const codigoInputId = React.useId();
    const descripcionInputId = React.useId();
    const situacionInputId = React.useId();
    const ordenInputId = React.useId();
    const creadoInputId = React.useId();
    const actualizadoInputId = React.useId();

    if (!editando) return null;

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Editar Casillero"
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
        >
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del casillero
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del casillero. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="custom-scrollbar h-[400px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label htmlFor={idInputId}>ID</Label>
                                <Input id={idInputId} name="id" value={editando.id} disabled />
                            </div>
                            <div>
                                <Label htmlFor={codigoInputId}>Código *</Label>
                                <Input
                                    id={codigoInputId}
                                    name="codigo"
                                    value={editando.codigo}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Label htmlFor={descripcionInputId}>Descripción *</Label>
                                <Input
                                    id={descripcionInputId}
                                    name="descripcion"
                                    value={editando.descripcion}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>
                            <div>
                                <Label htmlFor={situacionInputId}>Situación</Label>
                                <Input
                                    id={situacionInputId}
                                    value={editando.situacion}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor={ordenInputId}>Orden Asignada</Label>
                                <Input
                                    id={ordenInputId}
                                    value={editando.order?.workOrderNumber || "Ninguna"}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor={creadoInputId}>Fecha de creación</Label>
                                <Input
                                    id={creadoInputId}
                                    value={new Date(editando.createdAt).toLocaleString()}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor={actualizadoInputId}>Última actualización</Label>
                                <Input
                                    id={actualizadoInputId}
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
                                        disabled={cargando || editando.situacion === 'Ocupado'}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                    {editando.situacion === 'Ocupado' && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            No se puede cambiar el estado de un casillero ocupado
                                        </p>
                                    )}
                                    {estadoModificado !== null && estadoModificado !== casillero?.estado && (
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
                </form>
            </div>
        </CrudModal>
    );
}