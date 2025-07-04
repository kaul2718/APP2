"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useMarcas } from "@/hooks/useMarcas";
import { useModelo } from "@/hooks/useModelo";
import { useTipoEquipo } from "@/hooks/useTipoEquipo";
import { Equipo } from "@/hooks/useEquipos";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    equipo: Equipo | null;
    onSave: (updatedEquipo: Equipo) => void;
}

export default function EquipoEditModal({ isOpen, onClose, equipo, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;

    // Hooks para obtener datos relacionados
    const { marcas } = useMarcas();
    const { modelos } = useModelo();
    const { tiposEquipo } = useTipoEquipo();

    // Estados
    const [editando, setEditando] = React.useState<Equipo | null>(equipo);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);
    const [tipoModificado, setTipoModificado] = React.useState<number | null>(null);
    const [marcaModificada, setMarcaModificada] = React.useState<number | null>(null);
    const [modeloModificado, setModeloModificado] = React.useState<number | null>(null);

    // Filtrar modelos según la marca seleccionada
    const modelosFiltrados = React.useMemo(() => {
        const marcaId = marcaModificada !== null ? marcaModificada : editando?.marca?.id;
        return marcaId ? modelos.filter(m => m.marca?.id === marcaId) : [];
    }, [marcaModificada, editando?.marca?.id, modelos]);


    React.useEffect(() => {
        if (equipo) {
            setEditando(equipo);
            setEstadoModificado(null);
            setTipoModificado(null);
            setMarcaModificada(null);
            setModeloModificado(null);

            // Establecer valores iniciales basados en el equipo
            if (equipo.marca) {
                setMarcaModificada(equipo.marca.id);
            }
            if (equipo.modelo) {
                setModeloModificado(equipo.modelo.id);
            }
        }
    }, [equipo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tipoId = Number(e.target.value);
        setTipoModificado(tipoId);

        setEditando(prev => {
            if (!prev) return null;

            const nuevoTipoEquipo = tiposEquipo.find(t => t.id === tipoId) || null;

            return {
                ...prev,
                tipoEquipo: nuevoTipoEquipo ? {
                    id: nuevoTipoEquipo.id,
                    nombre: nuevoTipoEquipo.nombre
                } : null
            };
        });
    };

    const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const marcaId = Number(e.target.value);
        setMarcaModificada(marcaId);
        setModeloModificado(null);

        setEditando(prev => {
            if (!prev) return null;

            const nuevaMarca = marcas.find(m => m.id === marcaId);

            return {
                ...prev,
                marca: nuevaMarca ? {
                    id: nuevaMarca.id,
                    nombre: nuevaMarca.nombre
                } : null,
                modelo: null
            };
        });
    };
    const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const modeloId = Number(e.target.value);
        setModeloModificado(modeloId);

        setEditando(prev => {
            if (!prev) return null;

            const nuevoModelo = modelos.find(m => m.id === modeloId);

            return {
                ...prev,
                modelo: nuevoModelo ? {
                    id: nuevoModelo.id,
                    nombre: nuevoModelo.nombre
                } : null
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
            const cambios: Partial<Equipo> = {};

            // Solo enviar los campos que han cambiado
            if (editando.numeroSerie !== equipo?.numeroSerie) cambios.numeroSerie = editando.numeroSerie;
            if (estadoModificado !== null && estadoModificado !== equipo?.estado) cambios.estado = estadoModificado;
            if (tipoModificado !== null && tipoModificado !== equipo?.tipoEquipo?.id) cambios.tipoEquipoId = tipoModificado;
            if (marcaModificada !== null && marcaModificada !== equipo?.marca?.id) cambios.marcaId = marcaModificada;
            if (modeloModificado !== null && modeloModificado !== equipo?.modelo?.id) cambios.modeloId = modeloModificado;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${editando.id}`, {
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
            setEditando(equipo);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
            setTipoModificado(null);
            setMarcaModificada(null);
            setModeloModificado(null);
        }
    };

    if (!editando) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Equipo">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del equipo
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del equipo. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>
                            <div>
                                <Label>Número de Serie *</Label>
                                <Input
                                    name="numeroSerie"
                                    value={editando.numeroSerie}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>

                            {/* Tipo de Equipo */}
                            <div className="space-y-2">
                                <Label htmlFor="tipo-select">Tipo de Equipo *</Label>
                                <select
                                    id="tipo-select"
                                    value={editando.tipoEquipo?.id || ""}
                                    onChange={handleTipoChange}
                                    disabled={cargando || tiposEquipo.length === 0}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {tiposEquipo.map((tipo) => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                                {tipoModificado !== null && tipoModificado !== equipo?.tipoEquipo?.id && (
                                    <div className="mt-2 flex items-start">
                                        <svg className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-yellow-600">
                                            Tipo se actualizará a: <strong>{tiposEquipo.find(t => t.id === tipoModificado)?.nombre}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Marca */}
                            <div className="space-y-2">
                                <Label htmlFor="marca-select">Marca *</Label>
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
                                {marcaModificada !== null && marcaModificada !== equipo?.marca?.id && (
                                    <div className="mt-2 flex items-start">
                                        <svg className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-yellow-600">
                                            Marca se actualizará a: <strong>{marcas.find(m => m.id === marcaModificada)?.nombre}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Modelo (dependiente de la marca) */}
                            <div className="space-y-2">
                                <Label htmlFor="modelo-select">Modelo *</Label>
                                <select
                                    id="modelo-select"
                                    value={modeloModificado !== null ? modeloModificado : editando.modelo?.id || ""}
                                    onChange={handleModeloChange}
                                    disabled={cargando || modelosFiltrados.length === 0}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                >
                                    <option value="">{
                                        modelosFiltrados.length === 0
                                            ? editando.marca
                                                ? "No hay modelos disponibles para esta marca"
                                                : "Primero seleccione una marca"
                                            : "Seleccione un modelo"
                                    }</option>
                                    {modelosFiltrados.map((modelo) => (
                                        <option key={modelo.id} value={modelo.id}>
                                            {modelo.nombre}
                                        </option>
                                    ))}
                                </select>
                                {modeloModificado !== null && modeloModificado !== equipo?.modelo?.id && (
                                    <div className="mt-2 flex items-start">
                                        <svg className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-yellow-600">
                                            Modelo se actualizará a: <strong>{modelos.find(m => m.id === modeloModificado)?.nombre}</strong>
                                        </span>
                                    </div>
                                )}
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

                            {/* Estado */}
                            <div className="space-y-2">
                                <Label htmlFor="estado-select">Estado</Label>
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
                                {estadoModificado !== null && estadoModificado !== equipo?.estado && (
                                    <div className="mt-2 flex items-start">
                                        <svg className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-yellow-600">
                                            Estado se actualizará a: <strong>{estadoModificado ? "Activo" : "Inactivo"}</strong>
                                        </span>
                                    </div>
                                )}
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