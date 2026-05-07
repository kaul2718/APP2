"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { DevicePhoneMobileIcon, TagIcon, CpuChipIcon, CubeIcon, PlusIcon, MagnifyingGlassIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Combobox } from "@headlessui/react";
import IngresarTipoEquipoForm from "../form/ingresar-tipo-equipo/IngresarTipoEquipoForm";
import IngresarMarcaForm from "../form/ingresar-marca/IngresarMarcaForm";
import IngresarModeloForm from "../form/ingresar-modelo/IngresarModeloForm";

interface FormData {
    numeroSerie: string;
    tipoEquipoId: string;
    marcaId: string;
    modeloId: string;
}

interface TipoEquipo {
    id: number;
    nombre: string;
}

interface Marca {
    id: number;
    nombre: string;
}

interface Modelo {
    id: number;
    nombre: string;
    marca: {
        id: number;
        nombre: string;
    };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (id: number) => void;
}

function generarNumeroSerie(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default function AgregarEquipoModal({ isOpen, onClose, onSuccess }: Props) {
    const { data: session } = useSession();
    const [formData, setFormData] = React.useState<FormData>({
        numeroSerie: "",
        tipoEquipoId: "",
        marcaId: "",
        modeloId: ""
    });
    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);
    const [tiposEquipo, setTiposEquipo] = React.useState<TipoEquipo[]>([]);
    const [marcas, setMarcas] = React.useState<Marca[]>([]);
    const [modelos, setModelos] = React.useState<Modelo[]>([]);
    const [initialLoad, setInitialLoad] = React.useState(true);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [tipoSearch, setTipoSearch] = React.useState("");
    const [marcaSearch, setMarcaSearch] = React.useState("");
    const [modeloSearch, setModeloSearch] = React.useState("");

    // Estados para los modales secundarios
    const [isTipoEquipoModalOpen, setIsTipoEquipoModalOpen] = React.useState(false);
    const [isMarcaModalOpen, setIsMarcaModalOpen] = React.useState(false);
    const [isModeloModalOpen, setIsModeloModalOpen] = React.useState(false);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setLoadError(null);

            // Obtener tipos de equipo
            const tiposRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/all?page=1&limit=100`,
                {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken || ""}`,
                    },
                }
            );

            if (!tiposRes.ok) {
                const errorData = await tiposRes.json().catch(() => ({}));
                throw new Error(errorData.message || "Error al cargar tipos de equipo");
            }

            const tiposData = await tiposRes.json();
            setTiposEquipo(tiposData.items || []);

            // Obtener marcas
            const marcasRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/marcas/all?page=1&limit=100`,
                {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken || ""}`,
                    },
                }
            );

            if (!marcasRes.ok) {
                const errorData = await marcasRes.json().catch(() => ({}));
                throw new Error(errorData.message || "Error al cargar marcas");
            }

            const marcasData = await marcasRes.json();
            setMarcas(marcasData.items || []);

            // Obtener modelos
            const modelosRes = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/all?page=1&limit=100`,
                {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken || ""}`,
                    },
                }
            );

            if (!modelosRes.ok) {
                const errorData = await modelosRes.json().catch(() => ({}));
                throw new Error(errorData.message || "Error al cargar modelos");
            }

            const modelosData = await modelosRes.json();
            setModelos(modelosData.items || []);

        } catch (error) {
            console.error("Error cargando datos iniciales:", error);
            setLoadError(error instanceof Error ? error.message : "Error al cargar datos");
            toast.error(error instanceof Error ? error.message : "Error al cargar datos");
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    React.useEffect(() => {
        if (session && isOpen) {
            fetchInitialData();
        }
    }, [session, isOpen]);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }

        if (field === "marcaId") {
            setFormData(prev => ({ ...prev, modeloId: "" }));
        }
    };

    // Funciones para manejar el éxito de los modales secundarios
    const handleTipoEquipoSuccess = (newTipoEquipo: TipoEquipo) => {
        setTiposEquipo(prev => [...prev, newTipoEquipo]);
        setFormData(prev => ({ ...prev, tipoEquipoId: newTipoEquipo.id.toString() }));
        setIsTipoEquipoModalOpen(false);
        toast.success(`Tipo de equipo "${newTipoEquipo.nombre}" agregado y seleccionado`);
    };

    const handleMarcaSuccess = (newMarca: Marca) => {
        setMarcas(prev => [...prev, newMarca]);
        setFormData(prev => ({ ...prev, marcaId: newMarca.id.toString(), modeloId: "" }));
        setIsMarcaModalOpen(false);
        toast.success(`Marca "${newMarca.nombre}" agregada y seleccionada`);
    };

    const handleModeloSuccess = (newModelo: Modelo) => {
        setModelos(prev => [...prev, newModelo]);
        setFormData(prev => ({
            ...prev,
            marcaId: newModelo.marca.id.toString(),
            modeloId: newModelo.id.toString()
        }));
        setIsModeloModalOpen(false);
        toast.success(`Modelo "${newModelo.nombre}" agregado y seleccionado`);
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.numeroSerie.trim()) {
            newErrors.numeroSerie = "El número de serie es requerido";
        } else if (formData.numeroSerie.trim().length < 3) {
            newErrors.numeroSerie = "El número de serie debe tener al menos 3 caracteres";
        }

        if (!formData.tipoEquipoId) {
            newErrors.tipoEquipoId = "Debe seleccionar un tipo de equipo";
        }

        if (!formData.marcaId) {
            newErrors.marcaId = "Debe seleccionar una marca";
        }

        if (!formData.modeloId) {
            newErrors.modeloId = "Debe seleccionar un modelo";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateFields()) {
            setLoading(false);
            return;
        }

        try {
            const equipoData = {
                numeroSerie: formData.numeroSerie,
                tipoEquipoId: parseInt(formData.tipoEquipoId),
                marcaId: parseInt(formData.marcaId),
                modeloId: parseInt(formData.modeloId),
                estado: true
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify(equipoData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al registrar equipo");
            }

            const nuevoEquipo = await res.json();
            toast.success("Equipo registrado con éxito ✅");

            // Resetear formulario
            setFormData({
                numeroSerie: "",
                tipoEquipoId: "",
                marcaId: "",
                modeloId: ""
            });

            onClose(); // Cierra el modal

            // Llama a onSuccess con el ID del nuevo equipo
            if (onSuccess) onSuccess(nuevoEquipo.id);

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    // Filtrar modelos según la marca seleccionada
    const modelosFiltrados = formData.marcaId
        ? modelos.filter(modelo => modelo.marca.id === Number(formData.marcaId))
        : [];

    const tiposFiltrados = tipoSearch.trim()
        ? tiposEquipo.filter((tipo) => tipo.nombre.toLowerCase().includes(tipoSearch.toLowerCase()))
        : tiposEquipo;

    const marcasFiltradas = marcaSearch.trim()
        ? marcas.filter((marca) => marca.nombre.toLowerCase().includes(marcaSearch.toLowerCase()))
        : marcas;

    const modelosBuscados = modeloSearch.trim()
        ? modelosFiltrados.filter((modelo) => modelo.nombre.toLowerCase().includes(modeloSearch.toLowerCase()))
        : modelosFiltrados;

    return (
        <>
            {/* Modal principal */}
            <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-3xl" title="Registrar Nuevo Equipo">
                <div className="no-scrollbar relative w-full overflow-y-auto rounded-2xl bg-white p-5 dark:bg-gray-900 sm:p-6">
                    <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                        Registrar nuevo equipo
                    </h4>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        Complete todos los campos requeridos para registrar un nuevo equipo.
                    </p>

                    {loadError && (
                        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">
                            <p>Error al cargar datos: {loadError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="custom-scrollbar max-h-[62vh] overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 gap-x-4 gap-y-4">
                                {/* Número de Serie */}
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label>Número de Serie *</Label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nuevoNumero = generarNumeroSerie();
                                                handleChange("numeroSerie", nuevoNumero);
                                            }}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Generar número de serie automático"
                                        >
                                            <PlusIcon className="h-3 w-3" />
                                            Agregar random
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <Input
                                            value={formData.numeroSerie}
                                            onChange={(e) => handleChange("numeroSerie", e.target.value)}
                                            placeholder="Ej: SN123456789"
                                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.numeroSerie && <p className="text-sm text-red-500 mt-1">{errors.numeroSerie}</p>}
                                </div>

                                {/* Tipo de Equipo */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label>Tipo de Equipo *</Label>
                                        <button
                                            type="button"
                                            onClick={() => setIsTipoEquipoModalOpen(true)}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            <PlusIcon className="h-3 w-3" />
                                            Agregar nuevo
                                        </button>
                                    </div>
                                    <Combobox
                                        value={formData.tipoEquipoId}
                                        onChange={(value) => handleChange("tipoEquipoId", String(value ?? ""))}
                                        disabled={loading || initialLoad}
                                    >
                                        <div className="relative">
                                            <DevicePhoneMobileIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-white" />
                                            <Combobox.Input
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                displayValue={(value: string) => {
                                                    const tipo = tiposEquipo.find((t) => String(t.id) === value);
                                                    return tipo?.nombre || "";
                                                }}
                                                onChange={(e) => setTipoSearch(e.target.value)}
                                                placeholder="Buscar tipo de equipo..."
                                            />
                                            <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Combobox.Options className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                {tiposFiltrados.length === 0 ? (
                                                    <div className="cursor-default px-4 py-2 text-gray-500 dark:text-gray-400">
                                                        No se encontraron tipos
                                                    </div>
                                                ) : (
                                                    tiposFiltrados.map((tipo) => (
                                                        <Combobox.Option
                                                            key={tipo.id}
                                                            value={String(tipo.id)}
                                                            className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-600 text-white" : "text-gray-900 dark:text-gray-200"}`}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                                                        {tipo.nombre}
                                                                    </span>
                                                                    {selected && (
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                    {errors.tipoEquipoId && <p className="text-sm text-red-500 mt-1">{errors.tipoEquipoId}</p>}
                                </div>

                                {/* Marca */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label>Marca *</Label>
                                        <button
                                            type="button"
                                            onClick={() => setIsMarcaModalOpen(true)}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            <PlusIcon className="h-3 w-3" />
                                            Agregar nuevo
                                        </button>
                                    </div>
                                    <Combobox
                                        value={formData.marcaId}
                                        onChange={(value) => handleChange("marcaId", String(value ?? ""))}
                                        disabled={loading || initialLoad}
                                    >
                                        <div className="relative">
                                            <CpuChipIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-white" />
                                            <Combobox.Input
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                displayValue={(value: string) => {
                                                    const marca = marcas.find((m) => String(m.id) === value);
                                                    return marca?.nombre || "";
                                                }}
                                                onChange={(e) => setMarcaSearch(e.target.value)}
                                                placeholder="Buscar marca..."
                                            />
                                            <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Combobox.Options className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                {marcasFiltradas.length === 0 ? (
                                                    <div className="cursor-default px-4 py-2 text-gray-500 dark:text-gray-400">
                                                        No se encontraron marcas
                                                    </div>
                                                ) : (
                                                    marcasFiltradas.map((marca) => (
                                                        <Combobox.Option
                                                            key={marca.id}
                                                            value={String(marca.id)}
                                                            className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-600 text-white" : "text-gray-900 dark:text-gray-200"}`}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                                                        {marca.nombre}
                                                                    </span>
                                                                    {selected && (
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                    {errors.marcaId && <p className="text-sm text-red-500 mt-1">{errors.marcaId}</p>}
                                </div>

                                {/* Modelo */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label>Modelo *</Label>
                                        <button
                                            type="button"
                                            onClick={() => setIsModeloModalOpen(true)}
                                            disabled={!formData.marcaId}
                                            className={`text-xs flex items-center gap-1 ${formData.marcaId ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                                        >
                                            <PlusIcon className="h-3 w-3" />
                                            Agregar nuevo
                                        </button>
                                    </div>
                                    <Combobox
                                        value={formData.modeloId}
                                        onChange={(value) => handleChange("modeloId", String(value ?? ""))}
                                        disabled={loading || !formData.marcaId}
                                    >
                                        <div className="relative">
                                            <CubeIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-white" />
                                            <Combobox.Input
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                displayValue={(value: string) => {
                                                    const modelo = modelosFiltrados.find((m) => String(m.id) === value);
                                                    return modelo ? `${modelo.nombre} (${modelo.marca?.nombre || "Sin marca"})` : "";
                                                }}
                                                onChange={(e) => setModeloSearch(e.target.value)}
                                                placeholder={formData.marcaId ? "Buscar modelo..." : "Primero seleccione una marca"}
                                            />
                                            <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Combobox.Options className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                {!formData.marcaId ? (
                                                    <div className="cursor-default px-4 py-2 text-gray-500 dark:text-gray-400">
                                                        Primero seleccione una marca
                                                    </div>
                                                ) : modelosBuscados.length === 0 ? (
                                                    <div className="cursor-default px-4 py-2 text-gray-500 dark:text-gray-400">
                                                        No se encontraron modelos para esta marca
                                                    </div>
                                                ) : (
                                                    modelosBuscados.map((modelo) => (
                                                        <Combobox.Option
                                                            key={modelo.id}
                                                            value={String(modelo.id)}
                                                            className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-600 text-white" : "text-gray-900 dark:text-gray-200"}`}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                                                        {modelo.nombre} ({modelo.marca?.nombre || "Sin marca"})
                                                                    </span>
                                                                    {selected && (
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                    {errors.modeloId && <p className="text-sm text-red-500 mt-1">{errors.modeloId}</p>}
                                    {formData.marcaId && !modelosFiltrados.length && (
                                        <p className="text-sm text-yellow-600 mt-1">
                                            No se encontraron modelos para esta marca
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading || initialLoad} loading={loading}>
                                Registrar Equipo
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal para agregar tipo de equipo */}
            <Modal
                isOpen={isTipoEquipoModalOpen}
                onClose={() => setIsTipoEquipoModalOpen(false)}
                className="max-w-[500px]"
                title="Agregar Tipo de Equipo"
            >
                <IngresarTipoEquipoForm
                    onSuccess={(newTipoEquipo) => handleTipoEquipoSuccess(newTipoEquipo)}
                    onClose={() => setIsTipoEquipoModalOpen(false)}
                />
            </Modal>

            {/* Modal para agregar marca */}
            <Modal
                isOpen={isMarcaModalOpen}
                onClose={() => setIsMarcaModalOpen(false)}
                className="max-w-[500px]"
                title="Agregar Marca"
            >
                <IngresarMarcaForm
                    onSuccess={(newMarca) => handleMarcaSuccess(newMarca)}
                    onClose={() => setIsMarcaModalOpen(false)}
                />
            </Modal>

            {/* Modal para agregar modelo */}
            <Modal
                isOpen={isModeloModalOpen}
                onClose={() => setIsModeloModalOpen(false)}
                className="max-w-[500px]"
                title="Agregar Modelo"
            >
                <IngresarModeloForm
                    onSuccess={(newModelo) => handleModeloSuccess(newModelo)}
                    onClose={() => setIsModeloModalOpen(false)}
                    defaultMarcaId={formData.marcaId ? parseInt(formData.marcaId) : undefined}
                />
            </Modal>
        </>
    );
}