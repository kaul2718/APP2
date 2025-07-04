"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { TipoManoObra } from "@/hooks/useTipoManoObra";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tipo: TipoManoObra | null;
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
}: {
    label: string;
    icon: React.ReactNode;
    value?: string | number | boolean | null;
}) => (
    <div>
        <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            {icon}
            {label}
        </label>
        <input
            type="text"
            readOnly
            value={
                value !== undefined && value !== null ? value.toString() : "No disponible"
            }
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
            tabIndex={-1}
        />
    </div>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(value);
};

export default function TipoManoObraDetailsModal({ isOpen, onClose, tipo }: Props) {
    if (!tipo) return null;

    const estaActivo = tipo.estado;
    const fechaCreacion = new Date(tipo.createdAt).toLocaleDateString();
    const fechaActualizacion = new Date(tipo.updatedAt).toLocaleDateString();
    const fechaEliminacion = tipo.deletedAt
        ? new Date(tipo.deletedAt).toLocaleDateString()
        : "No eliminado";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalles del Tipo de Mano de Obra"
            className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
        >
            <div className="px-6 py-4 space-y-8 text-sm">
                {/* Sección básica */}
                <section>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Información Básica
                    </h3>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <InputDisplay
                            label="ID"
                            value={tipo.id}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2h-2.93M12 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-5"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Nombre"
                            value={tipo.nombre}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.705 6.879 1.904M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Código"
                            value={tipo.codigo}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Costo"
                            value={formatCurrency(tipo.costo)}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Descripción"
                            value={tipo.descripcion}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                    </div>
                </section>

                {/* Estado */}
                <section>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Estado
                    </h3>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <InputDisplay
                            label="Estado"
                            value={estaActivo ? "Activo" : "Inactivo"}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d={
                                                estaActivo
                                                    ? "M9 12l2 2 4-4"
                                                    : "M6 18L18 6M6 6l12 12"
                                            }
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Fecha de Creación"
                            value={fechaCreacion}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Última Actualización"
                            value={fechaActualizacion}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                        <InputDisplay
                            label="Fecha de Eliminación"
                            value={fechaEliminacion}
                            icon={
                                <Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </Icon>
                            }
                        />
                    </div>
                </section>

                {/* Detalles asociados */}
                {tipo.detalles && tipo.detalles.length > 0 && (
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Detalles Asociados
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {tipo.detalles.map((detalle) => (
                                        <tr key={detalle.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {detalle.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {detalle.cantidad}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {new Date(detalle.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Cerrar */}
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