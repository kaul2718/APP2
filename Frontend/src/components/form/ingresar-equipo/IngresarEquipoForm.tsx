"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { DevicePhoneMobileIcon, TagIcon, CpuChipIcon, ClockIcon, PuzzlePieceIcon,CubeIcon   } from "@heroicons/react/24/outline";

// Componente Select temporal
const Select = ({ children, ...props }: any) => (
    <select {...props} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-10 bg-white dark:bg-gray-800 text-black dark:text-white">
        {children}
    </select>
);
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
    marca: {  // Cambiado para coincidir con la estructura real
        id: number;
        nombre: string;
    };
}

export default function IngresarEquipoForm() {
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

    // Cargar datos necesarios para los selects
    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                setLoadError(null);

                // Obtener tipos de equipo (usando /all como en Postman)
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

                // Obtener marcas (también con /all)
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

                // Obtener modelos (con /all)
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

        if (session) {
            fetchInitialData();
        }
    }, [session]);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error al editar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }

        // Si cambia la marca, resetear modelo
        if (field === "marcaId") {
            setFormData(prev => ({ ...prev, modeloId: "" }));
        }
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
                estado: true // Por defecto se crea habilitado
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
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar equipo");
                return;
            }

            toast.success("Equipo registrado con éxito ✅");

            // Resetear formulario
            setFormData({
                numeroSerie: "",
                tipoEquipoId: "",
                marcaId: "",
                modeloId: ""
            });

            // Redirigir después de 1 segundo
            setTimeout(() => {
                router.push('/ver-equipo');
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        } finally {
            setLoading(false);
        }
    };

    // Filtrar modelos según la marca seleccionada
    const modelosFiltrados = formData.marcaId
        ? modelos.filter(modelo => modelo.marca.id === Number(formData.marcaId))
        : [];


    return (
        <ComponentCard title="Registrar Nuevo Equipo">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {/* Número de Serie */}
                <div>
                    <Label>Número de Serie</Label>
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
                <div className="mb-4 w-full">
                    <Label htmlFor="tipoEquipoSelect" className="block text-base font-semibold text-gray-700 dark:text-white mb-1">
                        Tipo de Equipo
                    </Label>
                    <div className="relative">
                        <DevicePhoneMobileIcon
                            className="w-5 h-5 text-gray-500 dark:text-gray-300 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        />
                        <select
                            id="tipoEquipoSelect"
                            value={formData.tipoEquipoId}
                            onChange={(e) => handleChange("tipoEquipoId", e.target.value)}
                            disabled={loading || initialLoad}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150"
                        >
                            <option value="">Seleccione un tipo</option>
                            {Array.isArray(tiposEquipo) && tiposEquipo.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.tipoEquipoId && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.tipoEquipoId}
                        </p>
                    )}
                </div>

                {/* Marca */}
                <div className="mb-4 w-full">
                    <Label htmlFor="marcaSelect" className="block text-base font-semibold text-gray-700 dark:text-white mb-1">
                        Marca
                    </Label>
                    <div className="relative">
                        <CpuChipIcon
                            className="w-5 h-5 text-gray-500 dark:text-gray-300 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        />
                        <select
                            id="marcaSelect"
                            value={formData.marcaId}
                            onChange={(e) => handleChange("marcaId", e.target.value)}
                            disabled={loading || initialLoad}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150"
                        >
                            <option value="">Seleccione una marca</option>
                            {Array.isArray(marcas) && marcas.map((marca) => (
                                <option key={marca.id} value={marca.id}>
                                    {marca.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.marcaId && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.marcaId}
                        </p>
                    )}
                </div>

                {/* Modelo */}
                <div className="mb-4 w-full">
                    <Label htmlFor="modeloSelect" className="block text-base font-semibold text-gray-700 dark:text-white mb-1">
                        Modelo
                    </Label>
                    <div className="relative">
                        <CubeIcon   className="w-5 h-5 text-gray-500 dark:text-gray-300 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        <select
                            id="modeloSelect"
                            value={formData.modeloId}
                            onChange={(e) => handleChange("modeloId", e.target.value)}
                            disabled={loading || !formData.marcaId}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150"
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

                    {errors.modeloId && (
                        <p className="text-sm text-red-500 mt-1">{errors.modeloId}</p>
                    )}

                    {formData.marcaId && !modelosFiltrados.length && (
                        <p className="text-sm text-yellow-600 mt-1">
                            No se encontraron modelos para esta marca
                        </p>
                    )}
                </div>


                {/* Botón */}
                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading || initialLoad}
                    >
                        {loading ? "Registrando..." : "Registrar Equipo"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}