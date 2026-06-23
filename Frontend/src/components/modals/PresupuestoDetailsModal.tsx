"use client";

import React, { useState, useEffect } from "react";
import CrudModal from "@/components/modals/CrudModal";
import { Presupuesto, usePresupuesto } from "@/hooks/usePresupuesto";
import {
    CalendarIcon,
    CheckIcon,
    ClockIcon,
    DocumentTextIcon,
    HashtagIcon,
    UserIcon,
    XMarkIcon,
    TrashIcon,
    PlusIcon,
    WrenchScrewdriverIcon,
    CubeIcon
} from "@heroicons/react/24/outline";
import { apiRequest } from "@/lib/api";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import AgregarItemsPresupuestoModal from "./AgregarItemsPresupuestoModal";
import ConfirmDialog from "./ConfirmDialog";

interface PresupuestoOrderView {
    workOrderNumber?: string;
    problemaReportado?: string;
    client?: {
        nombre?: string;
        apellido?: string;
    };
    equipo?: {
        tipoEquipo?: { nombre?: string };
        marca?: { nombre?: string };
        modelo?: { nombre?: string };
    };
}

interface ResumenCostoDetalle {
    id?: number;
    tipo?: string;
    nombre?: string;
    cantidad?: number;
    costoUnitario?: number;
    costoTotal?: number;
    precioUnitario?: number;
    subtotal?: number;
    estado?: boolean;
}

interface ResumenPresupuestoView {
    detalleManoObra?: ResumenCostoDetalle[];
    detalleItems?: ResumenCostoDetalle[];
    costoManoObra?: number;
    costoItems?: number;
    costoTotal?: number;
}

type PresupuestoView = Presupuesto & {
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    orden?: PresupuestoOrderView | null;
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    presupuesto: PresupuestoView | null;
    resumen: ResumenPresupuestoView | null;
    onSuccess?: () => void;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex w-5 h-5 mr-2 text-gray-500 dark:text-gray-400">
        {children}
    </span>
);

const InputDisplay = ({
    label,
    icon,
    value,
    customDisplay,
}: {
    label: string;
    icon: React.ReactNode;
    value?: string | number | boolean | null;
    customDisplay?: React.ReactNode;
}) => (
    <div className="space-y-1">
        <p className="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            {icon}
            {label}
        </p>
        {customDisplay ? (
            customDisplay
        ) : (
            <div className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.03] px-4 py-3 text-sm font-bold text-gray-850 dark:text-gray-100 shadow-inner">
                {value !== undefined && value !== null ? value.toString() : "No disponible"}
            </div>
        )}
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.05] pb-2">
        {title}
    </h3>
);

const CardContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-3xl p-6 shadow-sm mb-6">
        {children}
    </div>
);

export default function PresupuestoDetailsModal({
    isOpen,
    onClose,
    presupuesto,
    resumen: initialResumen,
    onSuccess
}: Props) {
    const { updatePresupuesto, getResumenPresupuesto } = usePresupuesto();
    const { data: session } = useSession();

    const [view, setView] = useState<'details' | 'addItem'>('details');
    const [resumen, setResumen] = useState<any>(initialResumen);
    const [loadingDelete, setLoadingDelete] = useState<number | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        destructive?: boolean;
    } | null>(null);

    const fetchResumen = async () => {
        if (!presupuesto) return;
        try {
            const data = await getResumenPresupuesto(presupuesto.id);
            setResumen(data);
        } catch (error) {
            console.error(error);
        }
    };

    // Efecto crítico para cargar detalles de forma automática
    useEffect(() => {
        if (isOpen && presupuesto?.id) {
            setView('details');
            if (initialResumen) {
                setResumen(initialResumen);
            } else {
                void fetchResumen();
            }
        }
    }, [initialResumen, isOpen, presupuesto?.id]);

    const handleDeleteItem = (id: number, isService: boolean = false) => {
        setConfirmConfig({
            isOpen: true,
            title: isService ? "Eliminar Servicio" : "Eliminar Ítem",
            description: isService
                ? "¿Estás seguro de que deseas eliminar este servicio de mano de obra del presupuesto?"
                : "¿Estás seguro de que deseas eliminar este ítem y devolverlo al inventario?",
            destructive: true,
            onConfirm: async () => {
                setConfirmConfig(null);
                setLoadingDelete(id);
                try {
                    await apiRequest(`/detalles-presupuesto-item/${id}`, { method: 'DELETE' }, session);
                    toast.success(isService ? 'Servicio eliminado' : 'Ítem eliminado y devuelto al inventario');
                    await fetchResumen();
                    if (onSuccess) onSuccess(); // ¡Notificar al padre para recargar la lista de órdenes/totales!
                } catch (error: any) {
                    toast.error(error.message || 'Error al eliminar');
                } finally {
                    setLoadingDelete(null);
                }
            }
        });
    };

    if (!presupuesto) return null;

    if (view === 'addItem') {
        return (
            <CrudModal isOpen={isOpen} onClose={onClose} title={`Agregar Ítem / Servicio (Presupuesto #${presupuesto.id})`} onSubmit={async () => { }} hideActions mode="edit">
                <AgregarItemsPresupuestoModal
                    isOpen={true}
                    onClose={() => setView('details')}
                    presupuestoId={presupuesto.id}
                    embeddedMode={true}
                    showNavigation={false}
                    onSuccess={() => { 
                        setView('details'); 
                        void fetchResumen(); 
                        if (onSuccess) onSuccess(); // ¡Notificar al padre para recargar la lista de órdenes/totales!
                    }}
                    onBack={() => setView('details')}
                />
            </CrudModal>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "No especificada";
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-AR', options);
    };

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return "$ 0,00";
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getEstadoBadge = () => {
        if (presupuesto.deletedAt) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                    Eliminado
                </span>
            );
        }

        switch (presupuesto.estado?.nombre?.toLowerCase()) {
            case 'aprobado':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
                        Aprobado
                    </span>
                );
            case 'rechazado':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                        Rechazado
                    </span>
                );
            case 'pendiente':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
                        Pendiente
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {presupuesto.estado?.nombre || 'Sin estado'}
                    </span>
                );
        }
    };

    const handleChangeStatus = (newStatusId: number, statusName: string) => {
        setConfirmConfig({
            isOpen: true,
            title: `Cambiar Estado a ${statusName}`,
            description: `¿Estás seguro de cambiar el estado del presupuesto a ${statusName}?`,
            destructive: newStatusId === 4,
            onConfirm: async () => {
                setConfirmConfig(null);
                try {
                    if (!presupuesto?.id) {
                        throw new Error("No se puede cambiar estado de un presupuesto sin ID");
                    }

                    await updatePresupuesto(presupuesto.id, { estadoId: newStatusId });
                    if (onSuccess) onSuccess(); // ¡Notificar al padre para recargar la lista de órdenes/totales!
                    onClose();
                } catch (error) {
                    console.error("Error al cambiar estado del presupuesto:", error);
                }
            }
        });
    };

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalles de Presupuesto`}
            onSubmit={async () => { }}
            mode="view"
            hideActions
            maxWidth="max-w-4xl"
        >
            <div className="px-6 py-4 space-y-6 text-sm text-gray-700 dark:text-gray-300">
                <CardContainer>
                    <SectionHeader title="Información General" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <InputDisplay
                                label="Estado del Presupuesto"
                                value={presupuesto.estado?.nombre}
                                customDisplay={getEstadoBadge()}
                                icon={
                                    <Icon>
                                        {presupuesto.estado?.nombre?.toLowerCase() === 'aprobado' ? (
                                            <CheckIcon className="w-5 h-5 text-green-500" />
                                        ) : presupuesto.estado?.nombre?.toLowerCase() === 'rechazado' ? (
                                            <XMarkIcon className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <ClockIcon className="w-5 h-5 text-yellow-500" />
                                        )}
                                    </Icon>
                                }
                            />
                            <InputDisplay
                                label="Fecha de Emisión"
                                value={formatDate(presupuesto.fechaEmision)}
                                icon={
                                    <Icon>
                                        <CalendarIcon className="w-5 h-5" />
                                    </Icon>
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <Icon>
                                    <DocumentTextIcon className="w-5 h-5" aria-hidden="true" />
                                </Icon>
                                Descripción / Notas
                            </p>
                            <textarea
                                id="presupuesto-descripcion"
                                readOnly
                                value={presupuesto.descripcion || "Sin descripción"}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.03] px-4 py-3 text-sm font-semibold text-gray-805 dark:text-gray-100 h-[108px] resize-none outline-none"
                                aria-label="Descripción del presupuesto"
                            />
                        </div>
                    </div>
                </CardContainer>

                {resumen && (
                    <CardContainer>
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/[0.05] pb-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                Resumen de Costos
                            </h3>
                            {!presupuesto.deletedAt && (
                                <button
                                    type="button"
                                    onClick={() => setView('addItem')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 text-xs uppercase tracking-wider transition-colors"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" aria-hidden="true" /> Agregar Ítems / Servicios
                                </button>
                            )}
                        </div>
                        <div className="space-y-6">
                            {/* Mano de Obra y Servicios */}
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                                    <WrenchScrewdriverIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                                    Mano de Obra / Servicios
                                </p>

                                {resumen.detalleManoObra && resumen.detalleManoObra.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {resumen.detalleManoObra.map((mo: any, i: number) => (
                                            <div key={`mo-${i}`} className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/30 dark:border-blue-900/30 hover:shadow-md transition-all animate-fadeIn">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                                                        <WrenchScrewdriverIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-blue-950 dark:text-blue-200">
                                                            {mo.nombre || mo.tipo}
                                                        </span>
                                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-semibold">
                                                            Cantidad: {mo.cantidad} u. | Subtotal: {formatCurrency(mo.subtotal || mo.costoTotal)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!presupuesto.deletedAt && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(mo.id, true)}
                                                        disabled={loadingDelete === mo.id}
                                                        aria-label="Eliminar servicio del presupuesto"
                                                        className="p-1.5 text-blue-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400 text-center py-4 bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08]">
                                        No hay servicios registrados en este presupuesto.
                                    </div>
                                )}
                            </div>

                            {/* Repuestos e Ítems */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                        <CubeIcon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                                        Repuestos / Ítems
                                    </p>
                                </div>

                                {resumen.detalleItems && resumen.detalleItems.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {resumen.detalleItems.map((item: any, i: number) => (
                                            <div key={`item-${i}`} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.01] border border-gray-150 dark:border-white/[0.08] hover:shadow-md transition-all animate-fadeIn">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-600 dark:text-gray-400">
                                                        <CubeIcon className="h-4 w-4 text-brand-500" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                            {item.nombre}
                                                        </span>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">
                                                            Cantidad: {item.cantidad} u. | P. Unit: {formatCurrency(item.precioUnitario)} | Subtotal: {formatCurrency(item.subtotal)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!presupuesto.deletedAt && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(item.id, false)}
                                                        disabled={loadingDelete === item.id}
                                                        aria-label="Eliminar repuesto del presupuesto"
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400 text-center py-4 bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08]">
                                        No hay repuestos registrados en este presupuesto.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Total General */}
                        <div className="mt-6 bg-gray-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex items-center justify-between">
                            <div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 uppercase font-black tracking-wider block">Total General Acumulado</span>
                                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                    {formatCurrency(resumen.costoTotal)}
                                </span>
                            </div>
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-0.5 font-bold">
                                <div>Servicios: {formatCurrency(resumen.costoManoObra)}</div>
                                <div>Repuestos: {formatCurrency(resumen.costoItems)}</div>
                            </div>
                        </div>

                        {/* Botones para cambiar estado */}
                        {!presupuesto.deletedAt && (
                            <div className="mt-6 flex gap-3">
                                {presupuesto.estado?.id !== 2 && ( // Mostrar si no está aprobado
                                    <button
                                        onClick={() => handleChangeStatus(2, "Aprobado")}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-green-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        Aprobar
                                    </button>
                                )}

                                {presupuesto.estado?.id !== 4 && ( // Mostrar si no está rechazado
                                    <button
                                        onClick={() => handleChangeStatus(4, "Rechazado")}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                        Rechazar
                                    </button>
                                )}

                                {presupuesto.estado?.id !== 1 && ( // Mostrar si no está pendiente
                                    <button
                                        onClick={() => handleChangeStatus(1, "Pendiente")}
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-yellow-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ClockIcon className="h-5 w-5" aria-hidden="true" />
                                        Poner Pendiente
                                    </button>
                                )}
                            </div>
                        )}
                    </CardContainer>
                )}

                {/* Botón de Cierre */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onClose}
                        className="w-full max-w-xs rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {confirmConfig && (
                <ConfirmDialog
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                    destructive={confirmConfig.destructive}
                    onConfirm={confirmConfig.onConfirm}
                    onClose={() => setConfirmConfig(null)}
                />
            )}
        </CrudModal>
    );
}