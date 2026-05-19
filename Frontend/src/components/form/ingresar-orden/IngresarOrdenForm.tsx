"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useEquipos } from "@/hooks/useEquipos";
import { useUsuario } from "@/hooks/useUsuario";
import { useEstadoOrden } from "@/hooks/useEstadoOrden";
import { Role } from "@/types/role";
import AgregarClienteModal from "@/components/modals/AgregarClienteModal";
import AgregarEquipoModal from "@/components/modals/AgregarEquipoModal";
import { Combobox } from '@headlessui/react'
import { MagnifyingGlassIcon, ClipboardDocumentCheckIcon, BoltIcon } from '@heroicons/react/24/outline'
import { OrderType } from "@/types/order.types";
import { ChecklistItemResult } from "@/types/checklist.types";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import PeritajeForm from "./PeritajeForm";

interface FormData {
    workOrderNumber?: string;
    clientId: number | null;
    equipoId: number | null;
    problemaReportado: string;
    accesorios: string[];
    fechaPrometidaEntrega: string;
    technicianId: number | null;
    estadoOrdenId: number | null;
    currentAccessory: string;
    tipoOrden: OrderType;
    checklistData: ChecklistItemResult[] | null;
    tiempoEstimadoReparacion?: number;
}

interface FormErrors {
    clientId?: string;
    equipoId?: string;
    problemaReportado?: string;
}

interface IngresarOrdenFormProps {
    onSuccess?: (order: { id: number; workOrderNumber: string }) => void;
    onCancel?: () => void;
    embeddedMode?: boolean;
}


export default function IngresarOrdenForm({ onSuccess, onCancel, embeddedMode = false }: IngresarOrdenFormProps) {
    const router = useRouter();
    const { createOrder, getTechniciansAvailability } = useOrders();

    // Estados para controlar los modales
    const [isClienteModalOpen, setIsClienteModalOpen] = React.useState(false);
    const [isEquipoModalOpen, setIsEquipoModalOpen] = React.useState(false);

    // Estado adicional para búsqueda
    const [clientSearch, setClientSearch] = React.useState('')
    const [equipoSearch, setEquipoSearch] = React.useState('')
    const [techAvailability, setTechAvailability] = React.useState<any[]>([]);

    // Hooks para obtener datos necesarios
    const { usuarios = [], loading: loadingUsuarios, refetch: refetchUsuarios, fetchUsuarios, setUsuarios } = useUsuario({ defaultLimit: 1000 });
    const { equipos = [], loading: loadingEquipos, refetch: refetchEquipos } = useEquipos();
    const { estadosOrden } = useEstadoOrden();

    React.useEffect(() => {
        getTechniciansAvailability().then(data => {
            setTechAvailability(data || []);
        });
    }, []);

    // Filtrar clientes (usuarios con rol 'CLIENT')
    const clientes = React.useMemo(() =>
        usuarios.filter(
            (usuario) =>
                usuario.role === Role.CLIENT &&
                usuario.estado,
        ),
        [usuarios]
    );

    const tecnicos = React.useMemo(() =>
        usuarios.filter(usuario => usuario.role === Role.TECH && usuario.estado),
        [usuarios]
    );

    // Filtrar clientes según búsqueda
    const filteredClientes = clientSearch === ''
        ? clientes
        : clientes.filter(cliente =>
            `${cliente.nombre} ${cliente.apellido}`
                .toLowerCase()
                .includes(clientSearch.toLowerCase())
        )

    // Filtrar equipos según búsqueda
    const filteredEquipos = equipoSearch === ''
        ? equipos
        : equipos.filter(equipo =>
            `${equipo.tipoEquipo?.nombre} ${equipo.marca?.nombre} ${equipo.modelo?.nombre} ${equipo.numeroSerie}`
                .toLowerCase()
                .includes(equipoSearch.toLowerCase())
        )

    const [formData, setFormData] = React.useState<FormData>({
        //workOrderNumber: "",
        clientId: null,
        equipoId: null,
        problemaReportado: "",
        accesorios: [],
        fechaPrometidaEntrega: "",
        technicianId: null,
        estadoOrdenId: null,
        currentAccessory: "",
        tipoOrden: OrderType.EXPRESS,
        checklistData: null,
        tiempoEstimadoReparacion: 0
    });

    const [errors, setErrors] = React.useState<FormErrors>({});
    const [loading, setLoading] = React.useState(false);
    const hasLoadedExtendedUsers = React.useRef(false);
    const { getTemplateByTipoEquipo, selectedTemplate, loadingTemplate } = useChecklistTemplate();

    React.useEffect(() => {
        if (hasLoadedExtendedUsers.current) return;
        hasLoadedExtendedUsers.current = true;
        void fetchUsuarios(1, 200, "", false);
    }, [fetchUsuarios]);

    // Cargar plantilla cuando cambia el equipo
    React.useEffect(() => {
        const fetchTemplate = async () => {
            if (formData.equipoId && formData.tipoOrden === OrderType.COMPLETA) {
                const equipo = equipos.find(e => e.id === Number(formData.equipoId)) as any;
                const tipoEquipoId = equipo?.tipoEquipo?.id || equipo?.tipoEquipoId;
                
                // Solo cargar si el tipo de equipo cambió y no es la plantilla que ya tenemos
                if (tipoEquipoId && (!selectedTemplate || selectedTemplate.tipoEquipoId !== Number(tipoEquipoId))) {
                    try {
                        await getTemplateByTipoEquipo(Number(tipoEquipoId));
                    } catch (error) {
                        console.log(`No hay plantilla para el tipo de equipo ${tipoEquipoId}`);
                    }
                }
            } else if (formData.tipoOrden !== OrderType.COMPLETA) {
                // Si cambia a Express, podemos limpiar la plantilla seleccionada si fuera necesario
                // Pero lo dejamos así para no interferir con el estado global si se vuelve a cambiar a Completa
            }
        };
        fetchTemplate();
    }, [formData.equipoId, formData.tipoOrden, equipos, getTemplateByTipoEquipo, selectedTemplate]);

    const handleChange = (field: keyof FormData, value: string | number | string[] | ChecklistItemResult[] | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field in errors) {
            setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
        }
    };

    // Manejar creación de cliente
    const handleClienteCreado = async (nuevoCliente: any) => {
        // Inyectar el nuevo cliente inmediatamente en la lista local para que aparezca al instante
        const clientWithFields = {
            ...nuevoCliente,
            role: nuevoCliente.role || Role.CLIENT,
            estado: nuevoCliente.estado !== undefined ? nuevoCliente.estado : true
        };
        setUsuarios(prev => [clientWithFields, ...prev]);
        setFormData(prev => ({ ...prev, clientId: clientWithFields.id }));
        setClientSearch(""); // Limpiar búsqueda para que el Combobox muestre el valor seleccionado
        await fetchUsuarios(1, 200, "", false); // Mantener la lista de 200 usuarios actualizada
    };

    // Manejar creación de equipo
    const handleEquipoCreado = async (nuevoEquipoId: number) => {
        await refetchEquipos(); // Actualiza la lista de equipos
        setFormData(prev => ({ ...prev, equipoId: nuevoEquipoId }));
    };

    const addAccessory = () => {
        if (formData.currentAccessory.trim()) {
            handleChange("accesorios", [...formData.accesorios, formData.currentAccessory]);
            setFormData(prev => ({ ...prev, currentAccessory: "" }));
        }
    };

    const removeAccessory = (index: number) => {
        const newAccessories = [...formData.accesorios];
        newAccessories.splice(index, 1);
        handleChange("accesorios", newAccessories);
    };

    const validateFields = () => {
        const newErrors: FormErrors = {};
        let isValid = true;

        // Validación de cliente
        if (!formData.clientId) {
            newErrors.clientId = "Debe seleccionar un cliente";
            isValid = false;
            // Scroll al campo y foco automático
            setTimeout(() => {
                document.getElementById('client-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('client-select')?.focus();
            }, 100);
        }

        // Validación de equipo
        if (!formData.equipoId) {
            newErrors.equipoId = "Debe seleccionar un equipo";
            isValid = false;
            if (formData.clientId) {
                setTimeout(() => {
                    document.getElementById('equipo-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('equipo-select')?.focus();
                }, 100);
            }
        }

        // Validación de problema reportado
        if (!formData.problemaReportado.trim()) {
            newErrors.problemaReportado = "El problema reportado es requerido";
            isValid = false;
            if (formData.clientId && formData.equipoId) {
                setTimeout(() => {
                    document.getElementById('problema-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('problema-textarea')?.focus();
                }, 100);
            }
        } else if (formData.problemaReportado.trim().length < 10) {
            newErrors.problemaReportado = "La descripción debe tener al menos 10 caracteres";
            isValid = false;
        }

        setErrors(newErrors);

        // Mostrar notificación toast si hay errores
        if (!isValid) {
            toast.error('Por favor complete los campos requeridos', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación antes de enviar
        if (!validateFields()) {
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                clientId: Number(formData.clientId),
                equipoId: Number(formData.equipoId),
                problemaReportado: formData.problemaReportado,
                accesorios: formData.accesorios,
                fechaPrometidaEntrega: formData.fechaPrometidaEntrega || undefined,
                technicianId: formData.technicianId ? Number(formData.technicianId) : undefined,
                tipoOrden: formData.tipoOrden,
                checklistData: formData.checklistData ? { results: formData.checklistData, fechaPeritaje: new Date().toISOString() } : undefined,
                tiempoEstimadoReparacion: Number(formData.tiempoEstimadoReparacion) || 0,
                ...(formData.estadoOrdenId && { estadoOrdenId: Number(formData.estadoOrdenId) })
            };

            const result = await createOrder(orderData);

            if (!result?.id) {
                throw new Error("No se pudo crear la orden. Intente nuevamente.");
            }

            toast.success(`Orden #${result.workOrderNumber} creada exitosamente`, {
                position: "top-center",
                autoClose: 3000,
            });

            if (onSuccess) {
                onSuccess({
                    id: result.id,
                    workOrderNumber: result.workOrderNumber,
                });
                return;
            }

            // Reset del formulario
            setFormData({
                clientId: null,
                equipoId: null,
                problemaReportado: "",
                accesorios: [],
                fechaPrometidaEntrega: "",
                technicianId: null,
                estadoOrdenId: null,
                currentAccessory: "",
                tipoOrden: OrderType.EXPRESS,
                checklistData: null,
                tiempoEstimadoReparacion: 0
            });

            if (!embeddedMode) {
                setTimeout(() => router.push('/ver-orden'), 1500);
            }

        } catch (error) {
            console.error('Error al crear orden:', error);
            toast.error(
                error instanceof Error
                    ? `${error.message}`
                    : "Error desconocido al crear la orden",
                {
                    position: "top-center",
                    autoClose: 5000,
                }
            );
        } finally {
            setLoading(false);
        }
    };
    const formContent = (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
            {/* Selección de cliente */}
            <div className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <Label>Cliente *</Label>
                    <button
                        type="button"
                        onClick={() => setIsClienteModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Agregar nuevo cliente"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Agregar cliente
                    </button>
                </div>
                <div className="min-w-0">
                    <div className="min-w-0 flex-1">
                        <Combobox value={formData.clientId} onChange={(value) => handleChange("clientId", value)}>
                            <div className="relative flex-grow">
                            <div className="relative">
                                <Combobox.Input
                                    id="client-select"
                                    className="w-full rounded-lg border border-gray-300 bg-white p-2 pl-10 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    displayValue={(value) => {
                                        const cliente = clientes.find((c) => c.id === value);
                                        return cliente ? `${cliente.nombre} ${cliente.apellido}` : "";
                                    }}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    placeholder="Buscar cliente..."
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            </div>

                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                                    {filteredClientes.length === 0 && clientSearch !== "" ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            No se encontraron clientes
                                        </div>
                                    ) : (
                                        filteredClientes.map((cliente) => (
                                            <Combobox.Option
                                                key={cliente.id}
                                                value={cliente.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-600 text-white" : "text-gray-900 dark:text-gray-300"}`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                                            {cliente.nombre} {cliente.apellido}
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
                            </div>
                        </Combobox>
                    </div>
                </div>

                {errors.clientId && <p className="mt-1 text-sm text-red-500">{errors.clientId}</p>}
            </div>

            {/* Selección de equipo */}
            <div className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <Label>Equipo *</Label>
                    <button
                        type="button"
                        onClick={() => setIsEquipoModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Agregar nuevo equipo"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Agregar equipo
                    </button>
                </div>
                <div className="min-w-0">
                    <div className="min-w-0 flex-1">
                        <Combobox
                            value={formData.equipoId}
                            onChange={(value) => handleChange("equipoId", value)}
                            disabled={loadingEquipos}
                        >
                            <div className="relative flex-grow">
                            <div className="relative">
                                <Combobox.Input
                                    id="equipo-select"
                                    className={`w-full rounded-lg border bg-white p-2 pl-10 text-black dark:bg-gray-800 dark:text-white ${loadingEquipos ? "cursor-not-allowed opacity-50" : ""} ${errors.equipoId ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                                    displayValue={(value) => {
                                        const equipo = equipos.find((e) => e.id === value);
                                        return equipo
                                            ? `${equipo.tipoEquipo?.nombre} - ${equipo.marca?.nombre} ${equipo.modelo?.nombre} (${equipo.numeroSerie})`
                                            : "";
                                    }}
                                    onChange={(e) => setEquipoSearch(e.target.value)}
                                    placeholder={loadingEquipos ? "Cargando equipos..." : "Buscar equipo..."}
                                    disabled={loadingEquipos}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            </div>

                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                                    {loadingEquipos ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            Cargando equipos...
                                        </div>
                                    ) : filteredEquipos.length === 0 && equipoSearch !== "" ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            No se encontraron equipos
                                        </div>
                                    ) : (
                                        filteredEquipos.map((equipo) => (
                                            <Combobox.Option
                                                key={equipo.id}
                                                value={equipo.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-blue-600 text-white" : "text-gray-900 dark:text-gray-300"}`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                                            {equipo.tipoEquipo?.nombre} - {equipo.marca?.nombre} {equipo.modelo?.nombre} ({equipo.numeroSerie})
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
                            </div>
                        </Combobox>
                    </div>
                </div>

                {errors.equipoId && <p className="mt-1 text-sm text-red-500">{errors.equipoId}</p>}
            </div>

            {/* Tipo de Orden y Peritaje */}
            <div className="mb-3">
                <Label className="mb-3">Tipo de Orden de Servicio *</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => handleChange("tipoOrden", OrderType.EXPRESS)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${formData.tipoOrden === OrderType.EXPRESS ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}
                    >
                        <div className={`rounded-full p-2 ${formData.tipoOrden === OrderType.EXPRESS ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                            <BoltIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white">Orden Express</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Recepción rápida sin peritaje inicial.</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleChange("tipoOrden", OrderType.COMPLETA)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${formData.tipoOrden === OrderType.COMPLETA ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}
                    >
                        <div className={`rounded-full p-2 ${formData.tipoOrden === OrderType.COMPLETA ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                            <ClipboardDocumentCheckIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white">Orden Completa</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Incluye revisión de periféricos y estética.</p>
                        </div>
                    </button>
                </div>

                {formData.tipoOrden === OrderType.COMPLETA && (
                    <div className="mt-4">
                        {!formData.equipoId ? (
                            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                Por favor seleccione un equipo primero para cargar la plantilla de revisión.
                            </div>
                        ) : loadingTemplate ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                                <span className="ml-3 text-sm text-gray-500">Cargando plantilla técnica...</span>
                            </div>
                        ) : selectedTemplate ? (
                            <PeritajeForm
                                template={selectedTemplate}
                                onChange={(results) => handleChange("checklistData", results)}
                            />
                        ) : (
                            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800/50">
                                No hay una plantilla de peritaje configurada para esta categoría de equipo. 
                                <span className="ml-1 text-xs italic">(Se guardará solo el problema reportado)</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Problema reportado */}
            <div className="mb-3">
                <Label>Problema Reportado *</Label>
                <textarea
                    id="problema-textarea"
                    value={formData.problemaReportado}
                    onChange={(e) => handleChange("problemaReportado", e.target.value)}
                    placeholder="Describa el problema reportado por el cliente"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    rows={4}
                />
                {errors.problemaReportado && <p className="mt-1 text-sm text-red-500">{errors.problemaReportado}</p>}
            </div>

            {/* Accesorios */}
            <div className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <Label>Accesorios</Label>
                    <button
                        type="button"
                        onClick={addAccessory}
                        title="Agregar accesorio"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Agregar accesorio
                    </button>
                </div>
                <div className="flex items-start gap-2 sm:items-center">
                    <input
                        value={formData.currentAccessory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currentAccessory: e.target.value }))}
                        placeholder="Ej: Cargador, Funda, Cable USB"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {formData.accesorios.length > 0 && (
                    <div className="mt-2">
                        <ul className="space-y-1">
                            {formData.accesorios.map((accesorio, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between rounded bg-gray-200 px-3 py-2 text-black dark:bg-gray-700 dark:text-white"
                                >
                                    <span className="truncate">{accesorio}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAccessory(index)}
                                        className="text-lg font-bold text-red-500 hover:text-red-700"
                                        title="Eliminar accesorio"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Grid para Tiempo Estimado de Reparación y Fecha Estimada de Entrega */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-3">
                {/* Tiempo estimado de reparación */}
                <div>
                    <Label>Horas Estimadas de Reparación</Label>
                    <input
                        type="number"
                        value={formData.tiempoEstimadoReparacion !== undefined ? formData.tiempoEstimadoReparacion : ""}
                        onChange={(e) => handleChange("tiempoEstimadoReparacion", e.target.value ? Number(e.target.value) : 0)}
                        min="0"
                        step="0.5"
                        placeholder="Ej: 2.5"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* Fecha prometida de entrega */}
                <div>
                    <Label className="mb-1 block">Fecha Estimada de Entrega</Label>
                    <input
                        type="datetime-local"
                        value={formData.fechaPrometidaEntrega}
                        onChange={(e) => handleChange("fechaPrometidaEntrega", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:block [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                    />
                </div>
            </div>

            {/* Selección de técnico */}
            <div className="mb-3">
                <Label>Técnico Asignado (Opcional)</Label>
                <select
                    value={formData.technicianId || ""}
                    onChange={(e) => handleChange("technicianId", e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium"
                >
                    <option value="">Seleccione un técnico</option>
                    {tecnicos.map((tecnico) => {
                        const availability = techAvailability.find(a => a.technicianId === tecnico.id);
                        let label = `${tecnico.nombre} ${tecnico.apellido}`;
                        if (availability) {
                            const partsStr = availability.waitingForParts > 0 ? ` (${availability.waitingForParts} en espera de repuestos)` : '';
                            label += ` (Órdenes activas: ${availability.workingActive}${partsStr}`;
                            if (availability.nextAvailableDate) {
                                const estDate = new Date(availability.nextAvailableDate);
                                label += `, Disponible aprox: ${estDate.toLocaleDateString()})`;
                            } else {
                                label += `, Disp. inmediata)`;
                            }
                        }
                        return (
                            <option key={tecnico.id} value={tecnico.id}>
                                {label}
                            </option>
                        );
                    })}
                </select>
                {!loadingUsuarios && tecnicos.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No se encontraron técnicos activos en la lista actual.</p>
                )}
            </div>

            <div className={embeddedMode ? "sticky bottom-0 -mx-1 mt-2 border-t border-gray-200 bg-white px-1 pt-4 dark:border-gray-700 dark:bg-gray-900" : "mt-2"}>
                <div className={embeddedMode ? "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" : "flex flex-col gap-2 sm:flex-row"}>
                    {onCancel && (
                        <Button
                            type="button"
                            onClick={onCancel}
                            className={embeddedMode ? "w-full sm:w-auto min-w-[120px]" : "w-full sm:w-auto"}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className={embeddedMode ? "flex w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[220px]" : "flex w-full items-center justify-center gap-2"}
                        disabled={loading || loadingUsuarios || loadingEquipos}
                    >
                        {loading ? "Creando orden..." : "Crear Orden de Trabajo"}
                    </Button>
                </div>
            </div>
        </form>
    );

    return (
        <>
            {embeddedMode ? (
                <div className="max-h-[75vh] overflow-y-auto px-3 pb-2 pr-5 sm:px-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[scrollbar-color:#475569_transparent] dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                    <div className="mb-3 border-b border-gray-200 pb-3 pr-12 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crear Nueva Orden de Trabajo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Complete los datos para registrar la orden sin salir de esta vista.
                        </p>
                    </div>
                    {formContent}
                </div>
            ) : (
                <ComponentCard title="Crear Nueva Orden de Trabajo">{formContent}</ComponentCard>
            )}

            <AgregarClienteModal
                isOpen={isClienteModalOpen}
                onClose={() => setIsClienteModalOpen(false)}
                onSuccess={handleClienteCreado}
            />

            <AgregarEquipoModal
                isOpen={isEquipoModalOpen}
                onClose={() => setIsEquipoModalOpen(false)}
                onSuccess={handleEquipoCreado}
            />
        </>
    );
}