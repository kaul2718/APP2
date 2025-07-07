'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DetalleRepuestoDetailsModal from "../modals/DetalleRepuestoDetailsModal";
import DetalleRepuestoEditModal from "../modals/DetalleRepuestoEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useDetalleRepuesto } from "@/hooks/useDetalleRepuesto";
import { CurrencyDollarIcon, DocumentTextIcon, HashtagIcon, TagIcon } from "@heroicons/react/24/outline";

export default function DetalleRepuestoTable({ presupuestoId }: { presupuestoId?: number }) {
    const {
        detalles,
        loading,
        setDetalles,
        fetchDetalles,
        fetchDetallesByPresupuesto,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        setSearchTerm,
        showInactive,
        setShowInactive,
        toggleDetalleStatus,
        deleteDetalle,
        restoreDetalle,
    } = useDetalleRepuesto();

    const { data: session } = useSession();
    const token = session?.accessToken || "";

    const [selectedDetalle, setSelectedDetalle] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleViewClick = (detalle: any) => {
        setSelectedDetalle(detalle);
        setIsModalOpen(true);
    };

    const handleEditClick = (detalle: any) => {
        setSelectedDetalle(detalle);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (detalle: any) => {
        setSelectedDetalle(detalle);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDetalle(null);
    };

    const handleSaveDetalle = (detalleActualizado: any) => {
        setDetalles(prev => prev.map(d => (d.id === detalleActualizado.id ? detalleActualizado : d)));
        refreshData();
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDetalle) return;

        try {
            await deleteDetalle(selectedDetalle.id);
            toast.success("Detalle de repuesto eliminado correctamente");
            refreshData();
        } catch (error) {
            console.error("Error al eliminar detalle:", error);
            toast.error("Error al eliminar detalle de repuesto");
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedDetalle(null);
        }
    };

    const handleRestoreConfirm = async () => {
        if (!selectedDetalle) return;

        try {
            await restoreDetalle(selectedDetalle.id);
            toast.success("Detalle de repuesto restaurado correctamente");
            refreshData();
        } catch (error) {
            console.error("Error al restaurar detalle:", error);
            toast.error("Error al restaurar detalle de repuesto");
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedDetalle(null);
        }
    };

    const handleToggleEstado = async (detalle: any) => {
        const estaActivo = detalle.estado;
        const accion = estaActivo ? "deshabilitar" : "habilitar";

        const confirmacion = confirm(`¿Estás seguro de ${accion} este detalle de repuesto?`);
        if (!confirmacion) return;

        try {
            await toggleDetalleStatus(detalle.id);
            toast.success(`Detalle de repuesto ${estaActivo ? 'deshabilitado' : 'habilitado'} correctamente`);
            refreshData();
        } catch (error) {
            console.error(`Error al ${accion} detalle:`, error);
            toast.error(`Error al ${accion} detalle de repuesto`);
        }
    };

    const refreshData = () => {
        if (presupuestoId) {
            fetchDetallesByPresupuesto(presupuestoId, showInactive);
        } else {
            fetchDetalles(currentPage, 10, searchTerm, showInactive);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            {/* Search and Filter Section */}
            <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-2">
                            <label
                                htmlFor="buscarDetalle"
                                className="text-base font-semibold text-gray-700 dark:text-white"
                            >
                                Buscar:
                            </label>
                            <div className="relative w-full sm:w-96">
                                <input
                                    id="buscarDetalle"
                                    type="text"
                                    placeholder="Por nombre de repuesto..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setSearchTerm(valor);
                                        if (presupuestoId) {
                                            fetchDetallesByPresupuesto(presupuestoId, showInactive);
                                        } else {
                                            fetchDetalles(1, 10, valor, showInactive);
                                        }
                                    }}
                                    aria-label="Buscar detalles de repuestos"
                                />
                                {searchTerm && (
                                    <button
                                        title="Limpiar búsqueda"
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onClick={() => {
                                            setSearchTerm("");
                                            if (presupuestoId) {
                                                fetchDetallesByPresupuesto(presupuestoId, showInactive);
                                            } else {
                                                fetchDetalles(1, 10, "", showInactive);
                                            }
                                        }}
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!presupuestoId && (
                            <>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={() => {
                                            const newValue = !showInactive;
                                            setShowInactive(newValue);
                                            if (presupuestoId) {
                                                fetchDetallesByPresupuesto(presupuestoId, newValue);
                                            } else {
                                                fetchDetalles(1, 10, searchTerm, newValue);
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                                    />
                                    Mostrar inactivos
                                </label>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Mostrando {detalles.length} de {totalItems} detalles
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                    <Table>
                        {/* Table Header */}
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    ID
                                </TableCell>
                                {!presupuestoId && (
                                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                        Presupuesto
                                    </TableCell>
                                )}
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Repuesto
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Cantidad
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Precio Unitario
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Subtotal
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Estado
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Acciones
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        {/* Table Body */}
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={presupuestoId ? 7 : 8} className="text-center py-4 text-gray-500">
                                        Cargando detalles de repuestos...
                                    </TableCell>
                                </TableRow>
                            ) : detalles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={presupuestoId ? 7 : 8} className="text-center py-4 text-gray-500">
                                        {searchTerm ? "No se encontraron resultados" : "No hay detalles de repuestos disponibles."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                detalles.map((detalle) => {
                                    const estaActivo = detalle.estado && !detalle.deletedAt;
                                    return (
                                        <TableRow key={detalle.id}>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                                                {detalle.id}
                                            </TableCell>

                                            {!presupuestoId && (
                                                <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                    <div className="flex items-center gap-2">
                                                        <HashtagIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {detalle.presupuestoId}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <div className="flex items-center gap-3">
                                                    <TagIcon className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                            {detalle.repuesto?.nombre || "Repuesto no disponible"}
                                                        </span>
                                                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                            {detalle.repuesto?.codigo || "Sin código"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 dark:text-gray-400">
                                                {detalle.cantidad}
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(detalle.precioUnitario)}
                                                </span>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <span className="font-medium text-gray-800 dark:text-white">
                                                    {formatCurrency(detalle.subtotal)}
                                                </span>
                                            </TableCell>

                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <Badge size="sm" color={estaActivo ? "success" : "error"}>
                                                    {estaActivo ? "Activo" : detalle.deletedAt ? "Eliminado" : "Inactivo"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <div className="flex items-center gap-4">
                                                    {/* Ver */}
                                                    <button
                                                        onClick={() => handleViewClick(detalle)}
                                                        className="text-blue-500 hover:text-blue-600"
                                                        title="Ver"
                                                        aria-label="Ver detalles"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>

                                                    {/* Editar */}
                                                    <button
                                                        className="text-yellow-500 hover:text-yellow-600"
                                                        onClick={() => handleEditClick(detalle)}
                                                        title="Editar"
                                                        aria-label="Editar detalle"
                                                        disabled={!estaActivo}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536l-12.5 12.5H4v-4.5l12.5-12.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Eliminar/Restaurar */}
                                                    {estaActivo ? (
                                                        <button
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={() => handleDeleteClick(detalle)}
                                                            title="Eliminar"
                                                            aria-label="Eliminar detalle"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="text-green-500 hover:text-green-600"
                                                            onClick={() => handleRestoreConfirm(detalle)}
                                                            title="Restaurar"
                                                            aria-label="Restaurar detalle"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination - Solo si no es vista de presupuesto */}
                {!presupuestoId && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
                        <div className="mb-4 sm:mb-0">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Página {currentPage} de {totalPages}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchDetalles(currentPage - 1, 10, searchTerm, showInactive)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => fetchDetalles(page, 10, searchTerm, showInactive)}
                                    className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === page
                                        ? "bg-blue-500 text-white border-blue-500"
                                        : "border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                    aria-label={`Ir a página ${page}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => fetchDetalles(currentPage + 1, 10, searchTerm, showInactive)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                aria-label="Página siguiente"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                <DetalleRepuestoDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    detalle={selectedDetalle}
                />

                <DetalleRepuestoEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    detalle={selectedDetalle}
                    onSave={handleSaveDetalle}
                />

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Confirmar eliminación
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                ¿Estás seguro de que deseas eliminar este detalle de repuesto?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}