"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useMarcas } from "@/hooks/useMarcas";
import { useCategoria } from "@/hooks/useCategoria";
import { Parte } from "@/hooks/usePartes";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    parte: Parte | null;
    onSave: (updatedParte: Parte) => void;
}

export default function ParteEditModal({ isOpen, onClose, parte, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { marcas } = useMarcas();
    const { categorias } = useCategoria();
    const [editando, setEditando] = useState<Parte | null>(parte);
    const [cargando, setCargando] = useState(false);
    const [estadoModificado, setEstadoModificado] = useState<boolean | null>(null);
    const [marcaModificada, setMarcaModificada] = useState<number | null>(null);
    const [categoriaModificada, setCategoriaModificada] = useState<number | null>(null);
    const marcaDropdownRef = useRef<HTMLDivElement>(null);
    const categoriaDropdownRef = useRef<HTMLDivElement>(null);

    // Estados para búsqueda en selects
    const [busquedaMarca, setBusquedaMarca] = useState("");
    const [busquedaCategoria, setBusquedaCategoria] = useState("");
    const [mostrarMarcas, setMostrarMarcas] = useState(false);
    const [mostrarCategorias, setMostrarCategorias] = useState(false);

    // Filtrar marcas y categorías según búsqueda
    const marcasFiltradas = marcas.filter(marca =>
        marca.nombre.toLowerCase().includes(busquedaMarca.toLowerCase())
    );

    const categoriasFiltradas = categorias.filter(categoria =>
        categoria.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (marcaDropdownRef.current && !marcaDropdownRef.current.contains(event.target as Node)) {
                setMostrarMarcas(false);
            }
            if (categoriaDropdownRef.current && !categoriaDropdownRef.current.contains(event.target as Node)) {
                setMostrarCategorias(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setEditando(parte);
        setEstadoModificado(null);
        setMarcaModificada(null);
        setCategoriaModificada(null);
        setBusquedaMarca("");
        setBusquedaCategoria("");
        setMostrarMarcas(false);
        setMostrarCategorias(false);
    }, [parte]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleMarcaChange = (marcaId: number) => {
        setMarcaModificada(marcaId);
        setEditando(prev => prev ? {
            ...prev,
            marca: marcas.find(m => m.id === marcaId) ? {
                id: marcaId,
                nombre: marcas.find(m => m.id === marcaId)!.nombre
            } : null
        } : null);
        setMostrarMarcas(false);
        setBusquedaMarca("");
    };

    const handleCategoriaChange = (categoriaId: number) => {
        setCategoriaModificada(categoriaId);
        setEditando(prev => prev ? {
            ...prev,
            categoria: categorias.find(c => c.id === categoriaId) ? {
                id: categoriaId,
                nombre: categorias.find(c => c.id === categoriaId)!.nombre
            } : null
        } : null);
        setMostrarCategorias(false);
        setBusquedaCategoria("");
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
            const cambios: Partial<Parte> = {};

            if (editando.nombre !== parte?.nombre) cambios.nombre = editando.nombre;
            if (editando.modelo !== parte?.modelo) cambios.modelo = editando.modelo;
            if (editando.descripcion !== parte?.descripcion) cambios.descripcion = editando.descripcion;
            if (estadoModificado !== null && estadoModificado !== parte?.estado)
                cambios.estado = estadoModificado;
            if (marcaModificada !== null && marcaModificada !== parte?.marca?.id)
                cambios.marcaId = marcaModificada;
            if (categoriaModificada !== null && categoriaModificada !== parte?.categoria?.id)
                cambios.categoriaId = categoriaModificada;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${editando.id}`, {
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
            setEditando(parte);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
            setMarcaModificada(null);
            setCategoriaModificada(null);
        }
    };

    if (!editando) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Parte">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información de la parte
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos de la parte. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
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
                            <div>
                                <Label>Modelo *</Label>
                                <Input
                                    name="modelo"
                                    value={editando.modelo}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Label>Descripción *</Label>
                                <textarea
                                    name="descripcion"
                                    value={editando.descripcion}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    rows={3}
                                />
                            </div>

                            {/* Selector de Categoría mejorado */}
                            <div className="space-y-2">
                                <Label htmlFor="categoria-select">Categoría *</Label>
                                <div className="relative" ref={categoriaDropdownRef}>
                                    <input
                                        type="text"
                                        value={busquedaCategoria}
                                        onChange={(e) => {
                                            setBusquedaCategoria(e.target.value);
                                            setMostrarCategorias(true);
                                        }}
                                        onFocus={() => setMostrarCategorias(true)}
                                        placeholder={editando.categoria?.nombre || "Buscar categoría..."}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    />

                                    {mostrarCategorias && (
                                        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white border border-gray-300 shadow-lg dark:bg-gray-800 dark:border-gray-600">
                                            {categoriasFiltradas.length > 0 ? (
                                                categoriasFiltradas.map((categoria) => (
                                                    <div
                                                        key={categoria.id}
                                                        onClick={() => handleCategoriaChange(categoria.id)}
                                                        className={`px-4 py-2 cursor-pointer ${editando.categoria?.id === categoria.id
                                                            ? "bg-blue-500 text-white"
                                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                                                            }`}
                                                    >
                                                        {categoria.nombre}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                                    No se encontraron categorías
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {categoriaModificada !== null && categoriaModificada !== parte?.categoria?.id && (
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
                                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                                Cambiará a: <strong>{categorias.find(c => c.id === categoriaModificada)?.nombre}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selector de Marca mejorado */}
                            <div className="space-y-2">
                                <Label htmlFor="marca-select">Marca *</Label>
                                <div className="relative" ref={marcaDropdownRef}>
                                    <input
                                        type="text"
                                        value={busquedaMarca}
                                        onChange={(e) => {
                                            setBusquedaMarca(e.target.value);
                                            setMostrarMarcas(true);
                                        }}
                                        onFocus={() => setMostrarMarcas(true)}
                                        placeholder={editando.marca?.nombre || "Buscar marca..."}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    />

                                    {mostrarMarcas && (
                                        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white border border-gray-300 shadow-lg dark:bg-gray-800 dark:border-gray-600">
                                            {marcasFiltradas.length > 0 ? (
                                                marcasFiltradas.map((marca) => (
                                                    <div
                                                        key={marca.id}
                                                        onClick={() => handleMarcaChange(marca.id)}
                                                        className={`px-4 py-2 cursor-pointer ${editando.marca?.id === marca.id
                                                            ? "bg-blue-500 text-white"
                                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                                                            }`}
                                                    >
                                                        {marca.nombre}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                                    No se encontraron marcas
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {marcaModificada !== null && marcaModificada !== parte?.marca?.id && (
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
                                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                                Cambiará a: <strong>{marcas.find(m => m.id === marcaModificada)?.nombre}</strong>
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
                                    {estadoModificado !== null && estadoModificado !== parte?.estado && (
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