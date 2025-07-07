'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import PresupuestoDetailsModal from "../modals/PresupuestoDetailsModal";
import PresupuestoEditModal from "../modals/PresupuestoEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { DocumentTextIcon, HashtagIcon, CurrencyDollarIcon, UserIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function PresupuestoTable() {
    const {
        presupuestos,
        loading,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        fetchPresupuestos,
        deletePresupuesto,
        restorePresupuesto,
        setSearchTerm,
        getResumenPresupuesto
    } = usePresupuesto();

    const { data: session } = useSession();
    const router = useRouter();

    const [selectedPresupuesto, setSelectedPresupuesto] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [resumen, setResumen] = useState<any>(null);

    const handleViewClick = async (presupuesto: any) => {
        try {
            const resumenData = await getResumenPresupuesto(presupuesto.id);
            setResumen(resumenData);
            setSelectedPresupuesto(presupuesto);
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Error al cargar el resumen del presupuesto");
        }
    };

    const handleEditClick = (presupuesto: any) => {
        setSelectedPresupuesto(presupuesto);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (presupuesto: any) => {
        setSelectedPresupuesto(presupuesto);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPresupuesto(null);
        setResumen(null);
    };

    const handleSavePresupuesto = (presupuestoActualizado: any) => {
        fetchPresupuestos(currentPage, 10, searchTerm);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPresupuesto) return;

        try {
            await deletePresupuesto(selectedPresupuesto.id);
            toast.success("Presupuesto eliminado correctamente");
            fetchPresupuestos(currentPage, 10, searchTerm);
        } catch (error) {
            console.error("Error al eliminar presupuesto:", error);
            toast.error("Error al eliminar presupuesto");
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedPresupuesto(null);
        }
    };

    const handleRestoreConfirm = async () => {
        if (!selectedPresupuesto) return;

        try {
            await restorePresupuesto(selectedPresupuesto.id);
            toast.success("Presupuesto restaurado correctamente");
            fetchPresupuestos(currentPage, 10, searchTerm);
        } catch (error) {
            console.error("Error al restaurar presupuesto:", error);
            toast.error("Error al restaurar presupuesto");
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedPresupuesto(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-AR', options);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            {/* Search Section */}
            <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-2">
                            <label
                                htmlFor="buscarPresupuesto"
                                className="text-base font-semibold text-gray-700 dark:text-white"
                            >
                                Buscar:
                            </label>
                            <div className="relative w-full sm:w-96">
                                <input
                                    id="buscarPresupuesto"
                                    type="text"
                                    placeholder="Por número de orden o cliente..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setSearchTerm(valor);
                                        fetchPresupuestos(1, 10, valor);
                                    }}
                                    aria-label="Buscar presupuestos"
                                />
                                {searchTerm && (
                                    <button
                                        title="Limpiar búsqueda"
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onClick={() => {
                                            setSearchTerm("");
                                            fetchPresupuestos(1, 10, "");
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

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Mostrando {presupuestos.length} de {totalItems} presupuestos
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
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Orden
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Cliente
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Estado
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Fecha Emisión
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Total
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
                                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                        Cargando presupuestos...
                                    </TableCell>
                                </TableRow>
                            ) : presupuestos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                        {searchTerm ? "No se encontraron resultados" : "No hay presupuestos disponibles."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                presupuestos.map((presupuesto) => {
                                    const estaEliminado = !!presupuesto.deletedAt;
                                    return (
                                        <TableRow key={presupuesto.id}>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <HashtagIcon className="w-4 h-4 text-gray-400" />
                                                    {presupuesto.id}
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <div className="flex items-center gap-2">
                                                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                                                    <span
                                                        className="text-blue-500 hover:text-blue-700 cursor-pointer"
                                                        onClick={() => router.push(`/ver-orden/${presupuesto.ordenId}`)}
                                                    >
                                                        #{presupuesto.orden?.workOrderNumber}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        {presupuesto.orden?.client?.nombre || "Cliente no disponible"} {presupuesto.orden?.client?.apellido}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <Badge size="sm" color={
                                                    presupuesto.estado?.nombre === 'Aprobado' ? 'success' :
                                                        presupuesto.estado?.nombre === 'Rechazado' ? 'error' : 'warning'
                                                }>
                                                    {presupuesto.estado?.nombre || 'Sin estado'}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {formatDate(presupuesto.fechaEmision)}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <div className="flex items-center gap-2">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">
                                                        {formatCurrency(
                                                            (presupuesto.detallesManoObra?.reduce((sum, d) => sum + Number(d.costoTotal), 0) || 0) +
                                                            (presupuesto.detallesRepuestos?.reduce((sum, d) => sum + Number(d.precioUnitario) * d.cantidad, 0) || 0)
                                                        )}
                                                    </span>

                                                </div>
                                            </TableCell>

                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <Badge size="sm" color={estaEliminado ? "error" : "success"}>
                                                    {estaEliminado ? "Eliminado" : "Activo"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <div className="flex items-center gap-4">
                                                    {/* Ver */}
                                                    <button
                                                        onClick={() => handleViewClick(presupuesto)}
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
                                                    {!estaEliminado && (
                                                        <button
                                                            className="text-yellow-500 hover:text-yellow-600"
                                                            onClick={() => handleEditClick(presupuesto)}
                                                            title="Editar"
                                                            aria-label="Editar presupuesto"
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
                                                    )}

                                                    {/* Eliminar/Restaurar */}
                                                    {estaEliminado ? (
                                                        <button
                                                            className="text-green-500 hover:text-green-600"
                                                            onClick={() => handleRestoreConfirm(presupuesto)}
                                                            title="Restaurar"
                                                            aria-label="Restaurar presupuesto"
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
                                                    ) : (
                                                        <button
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={() => handleDeleteClick(presupuesto)}
                                                            title="Eliminar"
                                                            aria-label="Eliminar presupuesto"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
                        <div className="mb-4 sm:mb-0">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Página {currentPage} de {totalPages}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchPresupuestos(currentPage - 1, 10, searchTerm)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => fetchPresupuestos(page, 10, searchTerm)}
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
                                onClick={() => fetchPresupuestos(currentPage + 1, 10, searchTerm)}
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
                <PresupuestoDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    presupuesto={selectedPresupuesto}
                    resumen={resumen}
                />

                <PresupuestoEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    presupuesto={selectedPresupuesto}
                    onSave={handleSavePresupuesto}
                />

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {selectedPresupuesto?.deletedAt ? "Restaurar presupuesto" : "Eliminar presupuesto"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {selectedPresupuesto?.deletedAt
                                    ? "¿Estás seguro de que deseas restaurar este presupuesto?"
                                    : "¿Estás seguro de que deseas eliminar este presupuesto?"}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={selectedPresupuesto?.deletedAt ? handleRestoreConfirm : handleDeleteConfirm}
                                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${selectedPresupuesto?.deletedAt ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                                >
                                    {selectedPresupuesto?.deletedAt ? "Restaurar" : "Eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}