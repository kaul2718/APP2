"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Presupuesto } from "@/hooks/usePresupuesto";
import { CalendarIcon, CheckIcon, ClockIcon, DocumentTextIcon, HashtagIcon, UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { toast } from "react-toastify";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    presupuesto: Presupuesto | null;
    resumen: any | null;
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
    resumen
}: Props) {

    const { updatePresupuesto } = usePresupuesto();

    if (!presupuesto) return null;

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

    const handleChangeStatus = async (newStatusId: number) => {
        try {
            if (!presupuesto?.id) {
                throw new Error("No se puede cambiar estado de un presupuesto sin ID");
            }

            await updatePresupuesto(presupuesto.id, { estadoId: newStatusId });
            //toast.success("Estado del presupuesto actualizado correctamente");

            // Cerrar el modal después de actualizar
            onClose();
        } catch (error) {
            //  console.error("Error al cambiar estado del presupuesto:", error);
           // toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
        }
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalles de Presupuesto #${presupuesto.id}`}
            className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
        >
            <div className="px-6 py-4 space-y-6 text-sm">
                {/* Sección 1: Información Principal */}
                <CardContainer>
                    <SectionHeader title="Información Principal" />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                        <InputDisplay
                            label="Número de Presupuesto"
                            value={presupuesto.id}
                            icon={
                                <Icon>
                                    <HashtagIcon className="w-5 h-5" />
                                </Icon>
                            }
                        />
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
                </CardContainer>

                {/* Sección 2: Información de la Orden */}
                <CardContainer>
                    <SectionHeader title="Orden Asociada" />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <InputDisplay
                            label="Número de Orden"
                            value={presupuesto.orden?.workOrderNumber}
                            icon={
                                <Icon>
                                    <DocumentTextIcon className="w-5 h-5" />
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Cliente"
                            value={presupuesto.orden?.client ?
                                `${presupuesto.orden.client.nombre} ${presupuesto.orden.client.apellido}` :
                                "No disponible"}
                            icon={
                                <Icon>
                                    <UserIcon className="w-5 h-5" />
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Equipo"
                            value={presupuesto.orden?.equipo ?
                                `${presupuesto.orden.equipo.tipoEquipo?.nombre} - ${presupuesto.orden.equipo.marca?.nombre} ${presupuesto.orden.equipo.modelo?.nombre}` :
                                "No disponible"}
                            icon={
                                <Icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Problema Reportado"
                            value={presupuesto.orden?.problemaReportado}
                            icon={
                                <Icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </Icon>
                            }
                        />
                    </div>
                </CardContainer>

                {/* Sección 3: Descripción */}
                {presupuesto.descripcion && (
                    <CardContainer>
                        <SectionHeader title="Descripción" />
                        <textarea
                            readOnly
                            value={presupuesto.descripcion}
                            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 min-h-[100px]"
                            tabIndex={-1}
                        />
                    </CardContainer>
                )}

                {/* Sección 4: Resumen de Costos */}
                {resumen && (
                    <CardContainer>
                        <SectionHeader title="Resumen de Costos" />

                        {/* Mano de Obra */}
                        <div className="mb-6">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Mano de Obra
                            </h4>

                            <div className="overflow-x-auto">
                                <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio Unitario</th>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {resumen.detalleManoObra?.map((item: any, index: number) => (
                                            <tr key={`mano-obra-${index}`}>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.tipo}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.costoUnitario)}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.costoTotal)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 dark:bg-gray-700 font-medium">
                                            <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                                Total Mano de Obra:
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {formatCurrency(resumen.costoManoObra)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Repuestos */}
                        <div className="mb-6">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Repuestos
                            </h4>

                            <div className="overflow-x-auto">
                                <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio Unitario</th>
                                            <th className="w-1/4 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {resumen.detalleRepuestos?.map((item: any, index: number) => (
                                            <tr key={`repuesto-${index}`}>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.nombre}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.precioUnitario)}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 dark:bg-gray-700 font-medium">
                                            <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                                Total Repuestos:
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                {formatCurrency(resumen.costoRepuestos)}
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
                                        onClick={() => handleChangeStatus(2)} // ID 2 para Aprobado
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckIcon className="h-5 w-5" />
                                        Aprobar
                                    </button>
                                )}

                                {presupuesto.estado?.id !== 4 && ( // Mostrar si no está rechazado
                                    <button
                                        onClick={() => handleChangeStatus(4)} // ID 4 para Rechazado
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                        Rechazar
                                    </button>
                                )}

                                {presupuesto.estado?.id !== 1 && ( // Mostrar si no está pendiente
                                    <button
                                        onClick={() => handleChangeStatus(1)} // ID 1 para Pendiente
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


                {/* Sección 5: Metadatos */}
                <CardContainer>
                    <SectionHeader title="Metadatos" />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                        <InputDisplay
                            label="Fecha de Creación"
                            value={formatDate(presupuesto.createdAt)}
                            icon={
                                <Icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Última Actualización"
                            value={formatDate(presupuesto.updatedAt)}
                            icon={
                                <Icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </Icon>
                            }
                        />
                        {presupuesto.deletedAt && (
                            <InputDisplay
                                label="Fecha de Eliminación"
                                value={formatDate(presupuesto.deletedAt)}
                                icon={
                                    <Icon>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </Icon>
                                }
                            />
                        )}
                    </div>
                </CardContainer>

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
        </Modal>
    );
}