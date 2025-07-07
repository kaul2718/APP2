"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Select } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, CalendarIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useEquipos } from "@/hooks/useEquipos";
import { useUsuario } from "@/hooks/useUsuario";
import { useEstadoOrden } from "@/hooks/useEstadoOrden";
import { Role } from "@/types/role";
import AgregarClienteModal from "@/components/modals/AgregarClienteModal";
import AgregarEquipoModal from "@/components/modals/AgregarEquipoModal";
import { Combobox } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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
}


export default function IngresarOrdenForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const { createOrder } = useOrders();

    // Estados para controlar los modales
    const [isClienteModalOpen, setIsClienteModalOpen] = React.useState(false);
    const [isEquipoModalOpen, setIsEquipoModalOpen] = React.useState(false);

    // Estado adicional para búsqueda
    const [clientSearch, setClientSearch] = React.useState('')
    const [equipoSearch, setEquipoSearch] = React.useState('')

    // Hooks para obtener datos necesarios
    const { usuarios = [], loading: loadingUsuarios, refetch: refetchUsuarios } = useUsuario();
    const { equipos = [], loading: loadingEquipos, refetch: refetchEquipos } = useEquipos();
    const { estadosOrden, loading: loadingEstados } = useEstadoOrden();

    // Filtrar clientes (usuarios con rol 'CLIENT')
    const clientes = React.useMemo(() =>
        usuarios.filter(usuario => usuario.role === Role.CLIENT || Role.TECH || Role.RECEP || Role.ADMIN && usuario.estado),
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
        currentAccessory: ""
    });

    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    const handleChange = (field: keyof FormData, value: string | number | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Manejar creación de cliente
    const handleClienteCreado = async (nuevoClienteId: number) => {
        await refetchUsuarios(); // Actualiza la lista de usuarios
        setFormData(prev => ({ ...prev, clientId: nuevoClienteId }));
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
        const newErrors: Partial<FormData> = {};
        let isValid = true;

        // Validación de cliente
        if (!formData.clientId) {
            newErrors.clientId = "⚠️ Debe seleccionar un cliente";
            isValid = false;
            // Scroll al campo y foco automático
            setTimeout(() => {
                document.getElementById('client-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('client-select')?.focus();
            }, 100);
        }

        // Validación de equipo
        if (!formData.equipoId) {
            newErrors.equipoId = "⚠️ Debe seleccionar un equipo";
            isValid = false;
            if (isValid) { // Solo hacer scroll si no hay error previo
                setTimeout(() => {
                    document.getElementById('equipo-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('equipo-select')?.focus();
                }, 100);
            }
        }

        // Validación de problema reportado
        if (!formData.problemaReportado.trim()) {
            newErrors.problemaReportado = "⚠️ El problema reportado es requerido";
            isValid = false;
            if (isValid) {
                setTimeout(() => {
                    document.getElementById('problema-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('problema-textarea')?.focus();
                }, 100);
            }
        } else if (formData.problemaReportado.trim().length < 10) {
            newErrors.problemaReportado = "⚠️ La descripción debe tener al menos 10 caracteres";
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
                fechaPrometidaEntrega: formData.fechaPrometidaEntrega || null,
                technicianId: formData.technicianId ? Number(formData.technicianId) : undefined,
                ...(formData.estadoOrdenId && { estadoOrdenId: Number(formData.estadoOrdenId) })
            };

            const result = await createOrder(orderData);

            if (!result?.id) {
                throw new Error("No se pudo crear la orden. Intente nuevamente.");
            }

            toast.success(`✅ Orden #${result.workOrderNumber} creada exitosamente`, {
                position: "top-center",
                autoClose: 3000,
            });

            // Reset del formulario
            setFormData({
                workOrderNumber: result.workOrderNumber || "",
                clientId: null,
                equipoId: null,
                problemaReportado: "",
                accesorios: [],
                fechaPrometidaEntrega: "",
                technicianId: null,
                estadoOrdenId: null,
                currentAccessory: ""
            });

            setTimeout(() => router.push('/ver-orden'), 1500);

        } catch (error) {
            console.error('Error al crear orden:', error);
            toast.error(
                error instanceof Error
                    ? `❌ ${error.message}`
                    : "❌ Error desconocido al crear la orden",
                {
                    position: "top-center",
                    autoClose: 5000,
                }
            );
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <ComponentCard title="Crear Nueva Orden de Trabajo">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                    {/* Número de orden */}
                    <div className="mb-4">
                        <Label className="mb-1 block">Número de Orden</Label>
                        <div className="relative">
                            <DocumentTextIcon className="w-5 h-5 text-gray-500 dark:text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <input
                                type="text"
                                value={formData.workOrderNumber || "Generando número de orden..."}
                                disabled
                                readOnly
                                className={`w-full pl-10 pr-4 p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-not-allowed transition
        ${formData.workOrderNumber
                                        ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
                                        : "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 italic animate-pulse"}
      `}
                            />
                        </div>
                    </div>


                    {/* Selección de cliente */}
                    <div className="mb-4">
                        <Label className="mb-1 block">Cliente</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Combobox value={formData.clientId} onChange={(value) => handleChange("clientId", value)}>
                                <div className="relative flex-grow">
                                    <div className="relative">
                                        <Combobox.Input
                                            className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-700"
                                            displayValue={(value) => {
                                                const cliente = clientes.find((c) => c.id === value);
                                                return cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
                                            }}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            placeholder="Buscar cliente..."
                                        />
                                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>

                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {filteredClientes.length === 0 && clientSearch !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                                No se encontraron clientes
                                            </div>
                                        ) : (
                                            filteredClientes.map((cliente) => (
                                                <Combobox.Option
                                                    key={cliente.id}
                                                    value={cliente.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'
                                                        }`
                                                    }
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
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

                            {/* Botón de icono solo, estilo "agregar" */}
                            <button
                                type="button"
                                onClick={() => setIsClienteModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                                title="Agregar nuevo cliente"
                            >
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {errors.clientId && (
                            <p className="text-sm text-red-500 mt-1">{errors.clientId}</p>
                        )}
                    </div>


                    {/* Selección de equipo */}
                    <div className="mb-4">
                        <Label className="mb-1 block">Equipo</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Combobox
                                value={formData.equipoId}
                                onChange={(value) => handleChange("equipoId", value)}
                                disabled={loadingEquipos}
                            >
                                <div className="relative flex-grow">
                                    <div className="relative">
                                        <Combobox.Input
                                            className={`w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2 pl-10 rounded-lg border ${loadingEquipos ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${errors.equipoId ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                                            displayValue={(value) => {
                                                const equipo = equipos.find((e) => e.id === value);
                                                return equipo
                                                    ? `${equipo.tipoEquipo?.nombre} - ${equipo.marca?.nombre} ${equipo.modelo?.nombre} (${equipo.numeroSerie})`
                                                    : '';
                                            }}
                                            onChange={(e) => setEquipoSearch(e.target.value)}
                                            placeholder={loadingEquipos ? 'Cargando equipos...' : 'Buscar equipo...'}
                                            disabled={loadingEquipos}
                                        />
                                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>

                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {loadingEquipos ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                                Cargando equipos...
                                            </div>
                                        ) : filteredEquipos.length === 0 && equipoSearch !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                                No se encontraron equipos
                                            </div>
                                        ) : (
                                            filteredEquipos.map((equipo) => (
                                                <Combobox.Option
                                                    key={equipo.id}
                                                    value={equipo.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'
                                                        }`
                                                    }
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
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

                            {/* Botón circular de agregar equipo */}
                            <button
                                type="button"
                                onClick={() => setIsEquipoModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                                title="Agregar nuevo equipo"
                            >
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {errors.equipoId && (
                            <p className="text-sm text-red-500 mt-1">{errors.equipoId}</p>
                        )}
                    </div>



                    {/* Problema reportado */}
                    <div className="mb-4">
                        <Label>Problema Reportado</Label>
                        <textarea
                            value={formData.problemaReportado}
                            onChange={(e) => handleChange("problemaReportado", e.target.value)}
                            placeholder="Describa el problema reportado por el cliente"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white"
                            rows={4}
                        />
                        {errors.problemaReportado && (
                            <p className="text-sm text-red-500 mt-1">{errors.problemaReportado}</p>
                        )}
                    </div>

                    {/* Accesorios */}
                    <div className="mb-4">
                        <Label className="mb-1 block">Accesorios</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                value={formData.currentAccessory}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, currentAccessory: e.target.value }))
                                }
                                placeholder="Ej: Cargador, Funda, Cable USB"
                                className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded-lg border border-gray-300 dark:border-gray-700"
                            />
                            <button
                                type="button"
                                onClick={addAccessory}
                                title="Agregar accesorio"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                            >
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {formData.accesorios.length > 0 && (
                            <div className="mt-2">
                                <ul className="space-y-1">
                                    {formData.accesorios.map((accesorio, index) => (
                                        <li
                                            key={index}
                                            className="flex justify-between items-center px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                                        >
                                            <span className="truncate">{accesorio}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAccessory(index)}
                                                className="text-red-500 hover:text-red-700 text-lg font-bold"
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

                    {/* Fecha prometida de entrega */}
                    <div className="mb-4">
                        <Label className="mb-1 block">Fecha Prometida de Entrega</Label>
                        <div className="relative">
                            <CalendarIcon className="w-5 h-5 text-gray-800 dark:text-gray-200 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <Input
                                type="datetime-local"
                                value={formData.fechaPrometidaEntrega}
                                onChange={(e) => handleChange("fechaPrometidaEntrega", e.target.value)}
                                className="w-full pl-10 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white"
                            />
                        </div>
                    </div>


                    {/* Selección de técnico */}
                    <div className="mb-4">
                        <Label>Técnico Asignado (Opcional)</Label>
                        <Select
                            value={formData.technicianId || ""}
                            onChange={(e) => handleChange("technicianId", Number(e.target.value))}
                            disabled={loadingUsuarios}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white"
                        >
                            <option value="">Seleccione un técnico</option>
                            {tecnicos.map((tecnico) => (
                                <option key={tecnico.id} value={tecnico.id}>
                                    {tecnico.nombre} {tecnico.apellido}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Botón de envío */}
                    <div>
                        <Button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2"
                            disabled={loading || loadingUsuarios || loadingEquipos}
                        >
                            {loading ? "Creando orden..." : "Crear Orden de Trabajo"}
                        </Button>
                    </div>
                </form>
            </ComponentCard>

            {/* Modales */}
            <AgregarClienteModal
                isOpen={isClienteModalOpen}
                onClose={() => setIsClienteModalOpen(false)}
                onSuccess={handleClienteCreado} // Pasa el handler de éxito
            />

            <AgregarEquipoModal
                isOpen={isEquipoModalOpen}
                onClose={() => setIsEquipoModalOpen(false)}
                onSuccess={handleEquipoCreado} // Pasa el handler de éxito
            />

        </>
    );
}