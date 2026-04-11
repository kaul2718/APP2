"use client";

import React from "react";
import { Combobox } from "@headlessui/react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Parte, usePartes } from "@/hooks/usePartes";
import { Inventario } from "@/hooks/useInventario";
import { MapPinIcon, HashtagIcon, ExclamationCircleIcon, CalendarIcon, ClockIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    inventario: Inventario | null;
    onSave: (updatedInventario: Inventario) => void;
}

export default function InventarioEditModal({ isOpen, onClose, inventario, onSave }: Props) {
    const { data: session, status } = useSession();
    const token = session?.accessToken || null;
    const { fetchAllPartes } = usePartes();
    const [partesDisponibles, setPartesDisponibles] = React.useState<Parte[]>([]);
    const [parteSearch, setParteSearch] = React.useState("");
    const [editando, setEditando] = React.useState<Inventario | null>(inventario);
    const [cargando, setCargando] = React.useState(false);
    const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);
    const [parteModificada, setParteModificada] = React.useState<number | null>(null);

    React.useEffect(() => {
        setEditando(inventario);
        setEstadoModificado(null);
        setParteModificada(null);
        setParteSearch("");
    }, [inventario]);

    React.useEffect(() => {
        if (!isOpen || status !== "authenticated") return;

        const loadPartes = async () => {
            try {
                const data = await fetchAllPartes(false);
                setPartesDisponibles(data.filter((parte) => parte.estado));
            } catch (error) {
                console.error("Error cargando partes para edición:", error);
            }
        };

        void loadPartes();
    }, [isOpen, status]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? {
            ...prev,
            [name]: name === 'cantidad' || name === 'stockMinimo'
                ? Number(value)
                : value
        } : null);
    };

    const filteredPartes = parteSearch === ""
        ? partesDisponibles
        : partesDisponibles.filter((parte) =>
            [parte.nombre, parte.modelo, parte.codigoInterno, parte.marca?.nombre, parte.categoria?.nombre]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(parteSearch.toLowerCase()))
        );

    const handleParteChange = (parteId: number) => {
        setParteModificada(parteId);

        setEditando(prev => {
            if (!prev) return null;

            const parteEncontrada = partesDisponibles.find(p => p.id === parteId);

            return {
                ...prev,
                parte: parteEncontrada ? {
                    id: parteEncontrada.id,
                    nombre: parteEncontrada.nombre,
                    modelo: parteEncontrada.modelo
                } : prev.parte,
                parteId
            };
        });

        setParteSearch("");
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
            const cambios: Partial<Inventario> = {};

            if (parteModificada !== null && parteModificada !== inventario?.parteId)
                cambios.parteId = parteModificada;
            if (editando.cantidad !== inventario?.cantidad)
                cambios.cantidad = editando.cantidad;
            if (editando.stockMinimo !== inventario?.stockMinimo)
                cambios.stockMinimo = editando.stockMinimo;
            if (editando.ubicacion !== inventario?.ubicacion)
                cambios.ubicacion = editando.ubicacion;
            if (estadoModificado !== null && estadoModificado !== inventario?.estado)
                cambios.estado = estadoModificado;

            if (Object.keys(cambios).length > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${editando.id}`, {
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
            setEditando(inventario);
        } finally {
            setCargando(false);
            setEstadoModificado(null);
            setParteModificada(null);
        }
    };

    if (!editando) return null;

    const bajoStock = editando.cantidad < editando.stockMinimo;

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Editar Inventario"
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
        >
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar registro de inventario
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Modifica los datos del inventario. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parte-select">Parte / Ítem *</Label>
                                <Combobox
                                    value={editando.parte?.id || null}
                                    onChange={(value: number) => handleParteChange(value)}
                                    disabled={cargando || partesDisponibles.length === 0}
                                >
                                    <div className="relative">
                                        <div className="relative">
                                            <Combobox.Input
                                                id="parte-select"
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                                displayValue={(value: number) => {
                                                    const parte = partesDisponibles.find((item) => item.id === value);
                                                    return parte ? `${parte.nombre} - ${parte.codigoInterno || parte.modelo || 'Sin referencia'}` : "";
                                                }}
                                                onChange={(event) => setParteSearch(event.target.value)}
                                                placeholder="Buscar parte o ítem..."
                                            />
                                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        </div>

                                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                                            {filteredPartes.length === 0 ? (
                                                <div className="px-4 py-2 text-gray-700 dark:text-gray-300">No se encontraron ítems</div>
                                            ) : (
                                                filteredPartes.map((parte) => (
                                                    <Combobox.Option
                                                        key={parte.id}
                                                        value={parte.id}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'}`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                    {parte.nombre} - {parte.codigoInterno || parte.modelo || 'Sin referencia'}
                                                                </span>
                                                                <span className={`block truncate text-xs ${selected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                    {parte.marca?.nombre || 'Sin marca'} · {parte.categoria?.nombre || 'Sin categoría'}
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

                                        {parteModificada !== null && parteModificada !== inventario?.parteId && (
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
                                                    La parte se actualizará a: <strong>{partesDisponibles.find(p => p.id === parteModificada)?.nombre}</strong>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Combobox>
                            </div>

                            <div>
                                <Label>Cantidad *</Label>
                                <div className="relative">
                                    <HashtagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="number"
                                        min="0"
                                        name="cantidad"
                                        value={editando.cantidad}
                                        onChange={handleInputChange}
                                        required
                                        disabled={cargando}
                                        className={`pl-10 ${bajoStock ? 'border-red-300 focus:ring-red-200' : ''}`}
                                    />
                                </div>
                                {bajoStock && (
                                    <p className="mt-1 text-sm text-red-600">
                                        <ExclamationCircleIcon className="inline h-4 w-4 mr-1" />
                                        La cantidad está por debajo del stock mínimo
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Stock Mínimo *</Label>
                                <div className="relative">
                                    <ExclamationCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="number"
                                        min="1"
                                        name="stockMinimo"
                                        value={editando.stockMinimo}
                                        onChange={handleInputChange}
                                        required
                                        disabled={cargando}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Ubicación *</Label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        name="ubicacion"
                                        value={editando.ubicacion}
                                        onChange={handleInputChange}
                                        required
                                        disabled={cargando}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Fecha de creación</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        value={new Date(editando.createdAt).toLocaleString()}
                                        disabled
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Última actualización</Label>
                                <div className="relative">
                                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        value={new Date(editando.updatedAt).toLocaleString()}
                                        disabled
                                        className="pl-10"
                                    />
                                </div>
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
                                    {estadoModificado !== null && estadoModificado !== inventario?.estado && (
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