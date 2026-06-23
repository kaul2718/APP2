"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { useOrders } from "@/hooks/useOrders";
import { DocumentTextIcon, CalendarIcon, CheckIcon, ClockIcon, XMarkIcon, WrenchScrewdriverIcon, CubeIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Presupuesto } from "@/hooks/usePresupuesto";
import AgregarItemsPresupuestoModal from "./AgregarItemsPresupuestoModal";
import { apiRequest } from "@/lib/api";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    presupuesto: Presupuesto | null;
    onSave: (updatedPresupuesto: Presupuesto, shouldClose?: boolean) => void;
}

export default function PresupuestoEditModal({ isOpen, onClose, presupuesto, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { estados, loading: estadosLoading } = useEstadoPresupuesto(); // Cambiado de isLoading a loading
    const { orders, loading: ordersLoading } = useOrders(); // Cambiado de isLoading a loading

    const [editando, setEditando] = React.useState<Presupuesto | null>(null);
    const [cargando, setCargando] = React.useState(false);
    const [errores, setErrores] = React.useState<Record<string, string>>({});

    const formatCurrency = (value?: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(Number(value || 0));

    // Estados para sub-modales
    const [isItemsOpen, setIsItemsOpen] = React.useState(false);

    // Estados para confirmación de eliminación
    const [deleteConfig, setDeleteConfig] = React.useState<{
        isOpen: boolean;
        type: 'item';
        id: number;
        title: string;
        description: string;
    }>({
        isOpen: false,
        type: 'item',
        id: 0,
        title: '',
        description: ''
    });

    // Inicializar el estado al abrir el modal
    React.useEffect(() => {
        if (presupuesto) {
            // Filtrar elementos inactivos o borrados antes de ponerlos en el estado editable
            const presupuestoFiltrado = {
                ...presupuesto,
                detallesPresupuestoItems: presupuesto.detallesPresupuestoItems?.filter(item => item.estado !== false && !item.deletedAt) || []
            };
            setEditando(presupuestoFiltrado);
            setErrores({});
        }
    }, [presupuesto]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value } : null);

        // Limpiar error si existe
        if (errores[name]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const estadoId = Number(e.target.value);
        const estadoSeleccionado = estados?.find(e => e.id === estadoId);

        if (!estadoSeleccionado) {
            setErrores(prev => ({
                ...prev,
                estadoId: "Estado no válido"
            }));
            return;
        }

        setEditando(prev => prev ? {
            ...prev,
            estadoId,
            estado: estadoSeleccionado
        } : null);

        // Limpiar error si existe
        if (errores.estadoId) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors.estadoId;
                return newErrors;
            });
        }
    };

    const handleOrdenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ordenId = Number(e.target.value);
        setEditando(prev => {
            if (!prev) return null;

            const updated: Presupuesto = {
                ...prev,
                ordenId,
                orden: orders.find(o => o.id === ordenId) || undefined
            };
            return updated;
        });
    };

    const handleCancel = () => {
        onClose();
    };

    const handleDeleteItem = (item: any) => {
        setDeleteConfig({
            isOpen: true,
            type: 'item',
            id: item.id,
            title: 'Eliminar Elemento',
            description: `¿Estás seguro de eliminar "${item.parte?.nombre}" del presupuesto?`
        });
    };

    const confirmDelete = async () => {
        if (cargando || !deleteConfig.id) return;
        setCargando(true);
        try {
            const endpoint = `/detalles-presupuesto-item/${deleteConfig.id}`;
            
            await apiRequest(endpoint, { method: 'DELETE' }, session);
            toast.success("Elemento eliminado");
            
            // Actualizar estado local inmediatamente para feedback instantáneo
            setEditando(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    detallesPresupuestoItems: prev.detallesPresupuestoItems?.filter(item => item.id !== deleteConfig.id)
                };
            });

            // Cerrar el diálogo y resetear ID
            setDeleteConfig({
                isOpen: false,
                type: 'item',
                id: 0,
                title: '',
                description: ''
            });
            
            // Notificar al padre para que refresque el sidebar y otros componentes
            await onSave(editando!, false); 
        } catch (error) {
            console.error("Error al eliminar:", error);
            toast.error("Error al eliminar el elemento");
        } finally {
            setCargando(false);
        }
    };

    const validarFormulario = (): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (!editando) {
            toast.error("No hay datos para guardar");
            return false;
        }

        // Validar estado
        if (!editando.estadoId || !estados?.some(e => e.id === editando.estadoId)) {
            nuevosErrores.estadoId = "Seleccione un estado válido";
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async () => {

        if (!validarFormulario()) return;
        if (!editando || !token || !presupuesto) return;

        setCargando(true);
        try {
            const cambios: Record<string, any> = {};

            // Verificar cambios en cada campo
            if (editando.descripcion !== presupuesto.descripcion) {
                cambios.descripcion = editando.descripcion;
            }

            if (editando.estadoId !== presupuesto.estadoId) {
                cambios.estadoId = editando.estadoId;
            }

            if (Object.keys(cambios).length === 0) {
                onClose();
                return;
            }

            // Construir el objeto completo con los cambios
            const presupuestoActualizado: Presupuesto = {
                ...presupuesto,
                ...cambios,
                estado: estados?.find(e => e.id === cambios.estadoId) || presupuesto.estado,
                orden: orders.find(o => o.id === cambios.ordenId) || presupuesto.orden
            };

            // Llamar a onSave con el objeto completo
            onSave(presupuestoActualizado);
            console.log("Cambios a enviar:", cambios);
            console.log("Presupuesto actualizado:", presupuestoActualizado);

            onClose();
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
        } finally {
            setCargando(false);
        }
    };

    const getEstadoIcon = () => {
        if (!editando || !estados) return null;
        const estado = estados.find(e => e.id === editando.estadoId);
        switch (estado?.nombre?.toLowerCase()) {
            case 'aprobado':
                return <CheckIcon className="w-5 h-5 text-green-500" />;
            case 'rechazado':
                return <XMarkIcon className="w-5 h-5 text-red-500" />;
            default:
                return <ClockIcon className="w-5 h-5 text-yellow-500" />;
        }
    };

    if (!editando) return null;

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={handleCancel}
            title={`Editar Presupuesto`}
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
        >
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-2 dark:bg-gray-900 lg:p-4">

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="custom-scrollbar max-h-[400px] overflow-y-auto px-1">
                        <div className="grid grid-cols-1 gap-6 pb-6">

                            {/* Estado y Descripción */}
                            <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="space-y-2">
                                    <Label htmlFor="estado-select">Estado</Label>
                                    <div className="relative">
                                        <div className="flex items-center">
                                            <div className="mr-2">
                                                {getEstadoIcon()}
                                            </div>
                                            <select
                                                id="estado-select"
                                                value={editando.estadoId || ""}
                                                onChange={handleEstadoChange}
                                                disabled={cargando || estadosLoading || estados?.length === 0}
                                                className={`w-full rounded-xl border ${errores.estadoId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-white disabled:opacity-50 transition-all`}
                                            >
                                                <option value="">Seleccione un estado</option>
                                                {estados?.map((estado) => (
                                                    <option key={estado.id} value={estado.id}>
                                                        {estado.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="descripcion-edit">Descripción General</Label>
                                    <textarea
                                        id="descripcion-edit"
                                        name="descripcion"
                                        value={editando.descripcion || ""}
                                        onChange={handleInputChange}
                                        disabled={cargando}
                                        className={`w-full rounded-xl border ${errores.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-white disabled:opacity-50 transition-all`}
                                        rows={2}
                                        placeholder="Ej: Presupuesto para reparación de placa base..."
                                    />
                                </div>
                            </div>

                            {/* Gestión de Contenido Técnico */}
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">Mano de Obra / Servicios</p>
                                    <div className="space-y-2">
                                        {/* Catalog Services */}
                                        {editando?.detallesPresupuestoItems?.filter(item => item.estado !== false && !item.deletedAt && item.parte?.unidadMedida === 'Servicio').map((item) => (
                                            <div key={`item-service-${item.id}`} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 animate-fadeIn">
                                                <div className="flex items-center gap-3">
                                                    <WrenchScrewdriverIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                                                    <div>
                                                        <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                                            {item.cantidad}x {item.parte?.nombre || `Servicio #${item.id}`}
                                                        </span>
                                                        <div className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 font-semibold">
                                                            Precio Unit: {formatCurrency(item.precioUnitario)} | Subtotal: {formatCurrency(item.subtotal)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item)}
                                                    aria-label="Eliminar servicio del presupuesto"
                                                    className="p-1.5 text-blue-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        ))}

                                        {editando?.detallesPresupuestoItems?.filter(item => item.estado !== false && !item.deletedAt && item.parte?.unidadMedida === 'Servicio').length === 0 && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center py-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                                No hay servicios registrados en este presupuesto.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">Repuestos / Ítems</p>
                                    <div className="space-y-2">
                                        {editando?.detallesPresupuestoItems?.filter(item => item.estado !== false && !item.deletedAt && item.parte?.unidadMedida !== 'Servicio').map((item) => (
                                            <div key={`item-prod-${item.id}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-fadeIn">
                                                <div className="flex items-center gap-3">
                                                    <CubeIcon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {item.cantidad}x {item.parte?.nombre || `Ítem #${item.id}`}
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-0.5 font-semibold">
                                                            Precio Unit: {formatCurrency(item.precioUnitario)} | Subtotal: {formatCurrency(item.subtotal)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item)}
                                                    aria-label="Eliminar repuesto del presupuesto"
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        ))}

                                        {editando?.detallesPresupuestoItems?.filter(item => item.estado !== false && !item.deletedAt && item.parte?.unidadMedida !== 'Servicio').length === 0 && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center py-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                                No hay repuestos registrados en este presupuesto.
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setIsItemsOpen(true)}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-brand-600 mt-2"
                                        >
                                            <PlusIcon className="h-4 w-4" aria-hidden="true" />
                                            AÑADIR ITEM / SERVICIO
                                        </button>
                                    </div>
                                </div>

                                {/* Resumen de Totales en Tiempo Real */}
                                {(() => {
                                    const totalServicios = editando.detallesPresupuestoItems
                                        ?.filter(item => item.estado !== false && !item.deletedAt && item.parte?.unidadMedida === 'Servicio')
                                        .reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0;

                                    const totalProductos = editando.detallesPresupuestoItems
                                        ?.filter(item => item.estado !== false && !item.deletedAt && item.parte?.unidadMedida !== 'Servicio')
                                        .reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0;

                                    const totalGeneral = totalServicios + totalProductos;

                                    return (
                                        <div className="bg-gray-100 dark:bg-gray-850 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between mt-4">
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase font-black tracking-wider block">Total General Acumulado</span>
                                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                                    {formatCurrency(totalGeneral)}
                                                </span>
                                            </div>
                                            <div className="text-right text-xs text-gray-500 space-y-0.5 font-semibold">
                                                <div>Servicios: {formatCurrency(totalServicios)}</div>
                                                <div>Repuestos: {formatCurrency(totalProductos)}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Sub-modales para gestión profunda - FUERA del form para evitar anidamiento */}
                {isItemsOpen && (
                    <AgregarItemsPresupuestoModal
                        isOpen={isItemsOpen}
                        onClose={() => {
                            setIsItemsOpen(false);
                        }}
                        onSuccess={() => {
                            onSave(editando!, false); // Refrescar datos sin cerrar modal
                            setIsItemsOpen(false);
                        }}
                        presupuestoId={editando.id}
                    />
                )}

                <ConfirmDialog
                    isOpen={deleteConfig.isOpen}
                    title={deleteConfig.title}
                    description={deleteConfig.description}
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteConfig(prev => ({ ...prev, isOpen: false }))}
                    destructive={true}
                    confirmText="Eliminar"
                />
            </div>
        </CrudModal>
    );
}