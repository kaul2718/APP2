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
import AgregarManoObraModal from "./AgregarManoObraModal ";
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

    // Estados para sub-modales
    const [isManoObraOpen, setIsManoObraOpen] = React.useState(false);
    const [isItemsOpen, setIsItemsOpen] = React.useState(false);

    // Estados para confirmación de eliminación
    const [deleteConfig, setDeleteConfig] = React.useState<{
        isOpen: boolean;
        type: 'manoObra' | 'item';
        id: number;
        title: string;
        description: string;
    }>({
        isOpen: false,
        type: 'manoObra',
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
                detallesManoObra: presupuesto.detallesManoObra?.filter(mo => mo.estado !== false && !mo.deletedAt) || [],
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

    const handleDeleteManoObra = (mo: any) => {
        setDeleteConfig({
            isOpen: true,
            type: 'manoObra',
            id: mo.id,
            title: 'Eliminar Servicio',
            description: `¿Estás seguro de eliminar el servicio "${mo.tipoManoObra?.nombre}"?`
        });
    };

    const handleDeleteItem = (item: any) => {
        setDeleteConfig({
            isOpen: true,
            type: 'item',
            id: item.id,
            title: 'Eliminar Repuesto',
            description: `¿Estás seguro de eliminar el repuesto "${item.parte?.nombre}"?`
        });
    };

    const confirmDelete = async () => {
        if (cargando || !deleteConfig.id) return;
        setCargando(true);
        try {
            const endpoint = deleteConfig.type === 'manoObra' 
                ? `/detalles-mano-obra/${deleteConfig.id}`
                : `/detalles-presupuesto-item/${deleteConfig.id}`;
            
            await apiRequest(endpoint, { method: 'DELETE' }, session);
            toast.success(deleteConfig.type === 'manoObra' ? "Servicio eliminado" : "Repuesto eliminado");
            
            // Actualizar estado local inmediatamente para feedback instantáneo
            setEditando(prev => {
                if (!prev) return null;
                if (deleteConfig.type === 'manoObra') {
                    return {
                        ...prev,
                        detallesManoObra: prev.detallesManoObra?.filter(mo => mo.id !== deleteConfig.id)
                    };
                } else {
                    return {
                        ...prev,
                        detallesPresupuestoItems: prev.detallesPresupuestoItems?.filter(item => item.id !== deleteConfig.id)
                    };
                }
            });

            // Cerrar el diálogo y resetear ID
            setDeleteConfig({
                isOpen: false,
                type: 'manoObra',
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
                                    <Label>Descripción General</Label>
                                    <textarea
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
                                    <h5 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Mano de Obra / Servicios</h5>
                                    <div className="space-y-2">
                                        {editando?.detallesManoObra?.filter(mo => mo.estado !== false && !mo.deletedAt).map((mo) => (
                                            <div key={mo.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <WrenchScrewdriverIcon className="h-4 w-4 text-brand-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {mo.cantidad}x {mo.tipoManoObra?.nombre || `Servicio #${mo.id}`}
                                                    </span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteManoObra(mo)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setIsManoObraOpen(true)}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-bold text-gray-500 hover:text-brand-600"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            AÑADIR SERVICIO
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Repuestos / Ítems</h5>
                                    <div className="space-y-2">
                                        {editando?.detallesPresupuestoItems?.filter(item => item.estado !== false && !item.deletedAt).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <CubeIcon className="h-4 w-4 text-brand-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {item.cantidad}x {item.parte?.nombre || `Ítem #${item.id}`}
                                                    </span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setIsItemsOpen(true)}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-bold text-gray-500 hover:text-brand-600"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            AÑADIR REPUESTO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Sub-modales para gestión profunda - FUERA del form para evitar anidamiento */}
                {isManoObraOpen && (
                    <AgregarManoObraModal
                        isOpen={isManoObraOpen}
                        onClose={() => {
                            setIsManoObraOpen(false);
                        }}
                        onSuccess={() => {
                            onSave(editando!, false); // Refrescar datos sin cerrar modal
                            setIsManoObraOpen(false);
                        }}
                        presupuestoId={editando.id}
                    />
                )}

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