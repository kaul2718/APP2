"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { DevicePhoneMobileIcon, TagIcon, CpuChipIcon, CubeIcon, PlusIcon } from "@heroicons/react/24/outline";
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
    const router = useRouter();
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

    return (
        <>
            {/* Modal principal */}
            <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4" title="Registrar Nuevo Equipo">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Registrar nuevo equipo
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        Complete todos los campos requeridos para registrar un nuevo equipo.
                    </p>

                    {loadError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                            <p>Error al cargar datos: {loadError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="custom-scrollbar h-[calc(100vh-250px)] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                                {/* Número de Serie */}
                                <div className="mb-4">
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
                                    <div className="relative">
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <select
                                            value={formData.tipoEquipoId}
                                            onChange={(e) => handleChange("tipoEquipoId", e.target.value)}
                                            disabled={loading || initialLoad}
                                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccione un tipo</option>
                                            {tiposEquipo.map((tipo) => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
                                    <div className="relative">
                                        <CpuChipIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <select
                                            value={formData.marcaId}
                                            onChange={(e) => handleChange("marcaId", e.target.value)}
                                            disabled={loading || initialLoad}
                                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccione una marca</option>
                                            {marcas.map((marca) => (
                                                <option key={marca.id} value={marca.id}>
                                                    {marca.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
                                    <div className="relative">
                                        <CubeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <select
                                            value={formData.modeloId}
                                            onChange={(e) => handleChange("modeloId", e.target.value)}
                                            disabled={loading || !formData.marcaId}
                                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">
                                                {formData.marcaId
                                                    ? modelosFiltrados.length
                                                        ? "Seleccione un modelo"
                                                        : "No hay modelos para esta marca"
                                                    : "Primero seleccione una marca"}
                                            </option>
                                            {modelosFiltrados.map((modelo) => (
                                                <option key={modelo.id} value={modelo.id}>
                                                    {modelo.nombre} ({modelo.marca?.nombre || 'Sin marca'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.modeloId && <p className="text-sm text-red-500 mt-1">{errors.modeloId}</p>}
                                    {formData.marcaId && !modelosFiltrados.length && (
                                        <p className="text-sm text-yellow-600 mt-1">
                                            No se encontraron modelos para esta marca
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
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