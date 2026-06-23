"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useMarcas } from "@/hooks/useMarcas";
import { Modelo } from "@/hooks/useModelo";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    modelo: Modelo | null;
    onSave: (updatedModelo: Modelo) => void;
}

interface UpdateModeloPayload {
    nombre?: string;
    estado?: boolean;
    marcaId?: number;
}

export default function ModeloEditModal({ isOpen, onClose, modelo, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { marcas } = useMarcas();
    const [editando, setEditando] = React.useState<Modelo | null>(modelo);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);
    const [marcaModificada, setMarcaModificada] = React.useState<number | null>(null);

    const idInputId = React.useId();
    const nombreInputId = React.useId();
    const fechaCreacionInputId = React.useId();
    const fechaActualizacionInputId = React.useId();

    React.useEffect(() => {
        setEditando(modelo);
        setEstadoModificado(null);
        setMarcaModificada(null);
    }, [modelo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const marcaId = Number(e.target.value);
        setMarcaModificada(marcaId);
        setEditando(prev => prev ? {
            ...prev,
            marca: marcas.find(m => m.id === marcaId) ? {
                id: marcaId,
                nombre: marcas.find(m => m.id === marcaId)!.nombre
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

    const handleSubmit = async () => {
        if (!editando || !token) return;

        setCargando(true);
        try {
            const cambios: UpdateModeloPayload = {};

            if (editando.nombre !== modelo?.nombre) cambios.nombre = editando.nombre;
            if (estadoModificado !== null && estadoModificado !== modelo?.estado)
                cambios.estado = estadoModificado;
            if (marcaModificada !== null && marcaModificada !== modelo?.marca?.id)
                cambios.marcaId = marcaModificada;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${editando.id}`, {
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
            setEditando(modelo);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
            setMarcaModificada(null);
        }
    };

    if (!editando) return null;

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Editar Modelo"
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
        >
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del modelo
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del modelo. Los cambios se guardarán al presionar "Guardar cambios".
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
                                <Label htmlFor={nombreInputId}>Nombre *</Label>
                                <Input
                                    id={nombreInputId}
                                    name="nombre"
                                    value={editando.nombre}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marca-select">Marca *</Label>
                                <div className="relative">
                                    <select
                                        id="marca-select"
                                        value={editando.marca?.id || ""}
                                        onChange={handleMarcaChange}
                                        disabled={cargando || marcas.length === 0}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="">Seleccione una marca</option>
                                        {marcas.map((marca) => (
                                            <option key={marca.id} value={marca.id}>
                                                {marca.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {marcaModificada !== null && marcaModificada !== modelo?.marca?.id && (
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
                                                La marca se actualizará a: <strong>{marcas.find(m => m.id === marcaModificada)?.nombre}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor={fechaCreacionInputId}>Fecha de creación</Label>
                                <Input
                                    id={fechaCreacionInputId}
                                    value={new Date(editando.createdAt).toLocaleString()}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor={fechaActualizacionInputId}>Última actualización</Label>
                                <Input
                                    id={fechaActualizacionInputId}
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
                                    {estadoModificado !== null && estadoModificado !== modelo?.estado && (
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