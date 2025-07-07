"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: any | null;
    onSave: (updatedItem: any) => void;
    itemType: string;
}

export default function StatusChangeModal({ isOpen, onClose, item, onSave, itemType }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [cargando, setCargando] = React.useState(false);
    const [nuevoEstado, setNuevoEstado] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        if (item) {
            setNuevoEstado(item.estado);
        }
    }, [item]);

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNuevoEstado(e.target.value === "activo");
    };

    const handleCancel = () => {
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || !token || nuevoEstado === null) return;

        setCargando(true);
        try {
            const cambios = {
                estado: nuevoEstado
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${itemType}s/${item.id}/status`, {
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
            toast.success(`Estado del ${itemType} actualizado correctamente`);
            onClose();
        } catch (error) {
            console.error("Error al cambiar el estado:", error);
            toast.error(error instanceof Error ? error.message : "Error al cambiar el estado");
        } finally {
            setCargando(false);
        }
    };

    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[500px] m-4" 
               title={`Cambiar estado del ${itemType}`}>
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Cambiar estado del {itemType}
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Estás modificando el estado de <strong>{item.nombre}</strong>.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="estado-select">Nuevo estado</Label>
                            <div className="relative">
                                <select
                                    id="estado-select"
                                    value={nuevoEstado ? "activo" : "inactivo"}
                                    onChange={handleEstadoChange}
                                    disabled={cargando}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                                {nuevoEstado !== item.estado && (
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
                                            El estado cambiará a: <strong>{nuevoEstado ? "Activo" : "Inactivo"}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Estado actual</Label>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    item.estado 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}>
                                    {item.estado ? "Activo" : "Inactivo"}
                                </div>
                            </div>
                            <div>
                                <Label>Nuevo estado</Label>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    nuevoEstado 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}>
                                    {nuevoEstado ? "Activo" : "Inactivo"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={cargando}>
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={cargando || nuevoEstado === item.estado} 
                            loading={cargando}
                        >
                            Confirmar Cambio
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}