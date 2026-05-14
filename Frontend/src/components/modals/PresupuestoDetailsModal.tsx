"use client";

import React, { useState, useEffect } from "react";
import CrudModal from "@/components/modals/CrudModal";
import { Presupuesto, usePresupuesto } from "@/hooks/usePresupuesto";
import { CalendarIcon, CheckIcon, ClockIcon, DocumentTextIcon, HashtagIcon, UserIcon, XMarkIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { apiRequest } from "@/lib/api";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import AgregarManoObraModal from "./AgregarManoObraModal ";
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
}

const Icon = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex w-5 h-5 mr-2 text-gray-400 dark:text-gray-500">
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
    <div>
        <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            {icon}
            {label}
        </label>
        {customDisplay ? (
            <div className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                {customDisplay}
            </div>
        ) : (
            <input
                type="text"
                readOnly
                value={
                    value !== undefined && value !== null ? value.toString() : "No disponible"
                }
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                tabIndex={-1}
            />
        )}
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
        {title}
    </h3>
);

const CardContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        {children}
    </div>
);

export default function PresupuestoDetailsModal({
    isOpen,
    onClose,
    presupuesto,
    resumen: initialResumen
}: Props) {

    const { updatePresupuesto, getResumenPresupuesto } = usePresupuesto();
    const { data: session } = useSession();

    const [view, setView] = useState<'details' | 'addManoObra' | 'addItem'>('details');
    const [resumen, setResumen] = useState<any>(initialResumen);
    const [loadingDelete, setLoadingDelete] = useState<number | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        destructive?: boolean;
    } | null>(null);

    useEffect(() => {
        if (initialResumen && isOpen) {
            setResumen(initialResumen);
            setView('details');
        }
    }, [initialResumen, isOpen]);

    const fetchResumen = async () => {
        if (!presupuesto) return;
        try {
            const data = await getResumenPresupuesto(presupuesto.id);
            setResumen(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteManoObra = (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: "Eliminar Mano de Obra",
            description: "¿Estás seguro de que deseas eliminar esta mano de obra del presupuesto?",
            destructive: true,
            onConfirm: async () => {
                setConfirmConfig(null);
                setLoadingDelete(id);
                try {
                    await apiRequest(`/detalles-mano-obra/${id}`, { method: 'DELETE' }, session);
                    toast.success('Mano de obra eliminada');
                    await fetchResumen();
                } catch (error: any) {
                    toast.error(error.message || 'Error al eliminar');
                } finally {
                    setLoadingDelete(null);
                }
            }
        });
    };

    const handleDeleteItem = (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: "Eliminar Ítem",
            description: "¿Estás seguro de que deseas eliminar este ítem y devolverlo al inventario?",
            destructive: true,
            onConfirm: async () => {
                setConfirmConfig(null);
                setLoadingDelete(id);
                try {
                    await apiRequest(`/detalles-presupuesto-item/${id}`, { method: 'DELETE' }, session);
                    toast.success('Ítem eliminado y devuelto al inventario');
                    await fetchResumen();
                } catch (error: any) {
                    toast.error(error.message || 'Error al eliminar');
                } finally {
                    setLoadingDelete(null);
                }
            }
        });
    };

    if (!presupuesto) return null;

    if (view === 'addManoObra') {
        return (
            <CrudModal isOpen={isOpen} onClose={onClose} title={`Agregar Mano de Obra (Presupuesto #${presupuesto.id})`} onSubmit={async () => { }} hideActions mode="edit">
                <AgregarManoObraModal
                    isOpen={true}
                    onClose={() => setView('details')}
                    presupuestoId={presupuesto.id}
                    embeddedMode={true}
                    showNavigation={false}
                    onSuccess={() => { setView('details'); fetchResumen(); }}
                    onBack={() => setView('details')}
                />
            </CrudModal>
        );
    }

    if (view === 'addItem') {
        return (
            <CrudModal isOpen={isOpen} onClose={onClose} title={`Agregar Ítem (Presupuesto #${presupuesto.id})`} onSubmit={async () => { }} hideActions mode="edit">
                <AgregarItemsPresupuestoModal
                    isOpen={true}
                    onClose={() => setView('details')}
                    presupuestoId={presupuesto.id}
                    embeddedMode={true}
                    showNavigation={false}
                    onSuccess={() => { setView('details'); fetchResumen(); }}
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Eliminado
                </span>
            );
        }

        switch (presupuesto.estado?.nombre?.toLowerCase()) {
            case 'aprobado':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Aprobado
                    </span>
                );
            case 'rechazado':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Rechazado
                    </span>
                );
            case 'pendiente':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pendiente
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
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
            <div className="px-6 py-4 space-y-6 text-sm">
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

                        <div>
                            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Icon>
                                    <DocumentTextIcon className="w-5 h-5" />
                                </Icon>
                                Descripción / Notas
                            </label>
                            <textarea
                                readOnly
                                value={presupuesto.descripcion || "Sin descripción"}
                                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 h-[120px] resize-none"
                                tabIndex={-1}
                            />
                        </div>
                    </div>
                </CardContainer>

                {resumen && (
                    <CardContainer>
                        <SectionHeader title="Resumen de Costos" />
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                                        Mano de Obra
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setView('addManoObra')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm text-xs transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Agregar
                                    </button>
                                </div>
                                <table className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">Tipo</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">Cant.</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">Subtotal</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 text-center w-12">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {resumen.detalleManoObra?.map((mo: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{mo.tipo}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{mo.cantidad}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(mo.costoTotal)}</td>
                                                <td className="px-4 py-2 text-sm text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteManoObra(mo.id)}
                                                        disabled={loadingDelete === mo.id}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 inline-flex"
                                                        title="Eliminar"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 dark:bg-gray-700 font-medium">
                                            <td colSpan={2} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                                Total Mano Obra:
                                            </td>
                                            <td colSpan={2} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {formatCurrency(resumen.costoManoObra)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                                        Repuestos / Ítems
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setView('addItem')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm text-xs transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Agregar
                                    </button>
                                </div>
                                <table className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">Repuesto</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">Cant.</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">P. Unit</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">Subtotal</th>
                                            <th className="px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 text-center w-12">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {resumen.detalleItems?.map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.nombre}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.precioUnitario)}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.subtotal)}</td>
                                                <td className="px-4 py-2 text-sm text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        disabled={loadingDelete === item.id}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 inline-flex"
                                                        title="Eliminar"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 dark:bg-gray-700 font-medium">
                                            <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                                Total Ítems:
                                            </td>
                                            <td colSpan={2} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {formatCurrency(resumen.costoItems)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total General */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Total General
                                </h4>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(resumen.costoTotal)}
                                </span>
                            </div>
                        </div>

                        {/* Botones para cambiar estado */}
                        {!presupuesto.deletedAt && (
                            <div className="mt-4 flex gap-2">
                                {presupuesto.estado?.id !== 2 && ( // Mostrar si no está aprobado
                                    <button
                                        onClick={() => handleChangeStatus(2, "Aprobado")} // ID 2 para Aprobado
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckIcon className="h-5 w-5" />
                                        Aprobar
                                    </button>
                                )}

                                {presupuesto.estado?.id !== 4 && ( // Mostrar si no está rechazado
                                    <button
                                        onClick={() => handleChangeStatus(4, "Rechazado")} // ID 4 para Rechazado
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                        Rechazar
                                    </button>
                                )}

                                {presupuesto.estado?.id !== 1 && ( // Mostrar si no está pendiente
                                    <button
                                        onClick={() => handleChangeStatus(1, "Pendiente")} // ID 1 para Pendiente
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ClockIcon className="h-5 w-5" />
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
                        className="w-full max-w-xs rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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