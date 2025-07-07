'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import OrdenDetailsModal from "../modals/OrdenDetailsModal";
import OrdenEditModal from "../modals/OrdenEditModal";
import AddBudgetModal from "../modals/AddBudgetModal";
import AddEvidenceModal from "../modals/AddEvidenceModal";
import AddActivityModal from "../modals/AddActivityModal";
import StatusChangeModal from "../modals/StatusChangeModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrders } from "@/hooks/useOrders";
import { Order } from "@/interfaces/order";

export default function OrdenTable() {
    const {
        orders,
        loading,
        fetchOrders,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        setSearchTerm,
        showInactive,
        setShowInactive,
        deleteOrder,
        toggleOrderStatus,
        changeOrderStatus,
        addActivity,
        updateOrder,

    } = useOrders();

    const { data: session } = useSession();
    const token = session?.accessToken || "";

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);


    const [editModalOpen, setEditModalOpen] = useState(false);

    // Función para manejar la edición
    const handleEdit = (order: Order) => {
        setSelectedOrder(order);
        setEditModalOpen(true);
    };

    // Función para guardar los cambios
    const handleSaveOrder = async (updatedData) => {
        try {
            if (!selectedOrder) return false;

            await updateOrder(selectedOrder.id, {
                technicianId: updatedData.technicianId,
                estadoOrdenId: updatedData.estadoOrdenId,
                problemaReportado: updatedData.problemaReportado,
                fechaPrometidaEntrega: updatedData.fechaPrometidaEntrega,
                accesorios: updatedData.accesorios
            });

            // Refrescar los datos
            await fetchOrders();
            return true;
        } catch (error) {
            console.error("Error saving order:", error);
            return false;
        }
    };

    const handleViewClick = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleEditClick = (order: Order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    };

    const handleAddBudget = (order: Order) => {
        setSelectedOrder(order);
        setIsBudgetModalOpen(true);
    };

    const handleAddEvidence = (order: Order) => {
        setSelectedOrder(order);
        setIsEvidenceModalOpen(true);
    };

    const handleAddActivity = (order: Order) => {
        setSelectedOrder(order);
        setIsActivityModalOpen(true);
    };

    const handleChangeStatus = (order: Order) => {
        setSelectedOrder(order);
        setIsStatusModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(false);
        setIsBudgetModalOpen(false);
        setIsEvidenceModalOpen(false);
        setIsActivityModalOpen(false);
        setIsStatusModalOpen(false);
        setSelectedOrder(null);
    };

    const handleToggleEstado = async (order: Order) => {
        const estaActivo = order.estado;
        const accion = estaActivo ? "deshabilitar" : "habilitar";

        const confirmacion = confirm(`¿Estás seguro de ${accion} esta orden?`);
        if (!confirmacion) return;

        try {
            await toggleOrderStatus(order.id);
            toast.success(`Orden ${!estaActivo ? 'habilitada' : 'deshabilitada'} correctamente`);
            fetchOrders(currentPage, 10, searchTerm, showInactive);
        } catch (error) {
            console.error(`Error al ${accion} orden:`, error);
            toast.error(`Error al ${accion} orden`);
        }
    };

    const handleDeleteOrder = async (order: Order) => {
        const confirmacion = confirm("¿Estás seguro de eliminar esta orden?");
        if (!confirmacion) return;

        try {
            await deleteOrder(order.id);
            toast.success("Orden eliminada correctamente");
            fetchOrders(currentPage, 10, searchTerm, showInactive);
        } catch (error) {
            console.error("Error al eliminar orden:", error);
            toast.error("Error al eliminar orden");
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No especificada';
        return new Date(dateString).toLocaleDateString();
    };

    const formatUserName = (user?: { nombre: string; apellido?: string }) => {
        if (!user) return 'No asignado';
        return `${user.nombre} ${user.apellido || ''}`.trim();
    };



    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            {/* Search and Filter Section */}
            <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-2">
                            <label
                                htmlFor="buscarOrden"
                                className="text-base font-semibold text-gray-700 dark:text-white"
                            >
                                Buscar:
                            </label>
                            <div className="relative w-full sm:w-96">
                                <input
                                    id="buscarOrden"
                                    type="text"
                                    placeholder="Por número de orden, cliente o equipo..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setSearchTerm(valor);
                                        fetchOrders(1, 10, valor, showInactive);
                                    }}
                                    aria-label="Buscar órdenes"
                                />
                                {searchTerm && (
                                    <button
                                        title="Limpiar búsqueda"
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onClick={() => {
                                            setSearchTerm("");
                                            fetchOrders(1, 10, "", showInactive);
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
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={() => setShowInactive(!showInactive)}
                                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                            Mostrar inactivos
                        </label>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando {orders.length} de {totalItems} órdenes
                        </div>
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
                                    N° Orden
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Cliente
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Técnico
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Equipo
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Estado
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                                    Fecha Prometida
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
                                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                        Cargando órdenes...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                        {searchTerm ? "No se encontraron resultados" : "No hay órdenes disponibles."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => {
                                    const estaActivo = order.estado;
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                                                {order.workOrderNumber}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <span className="text-gray-800 dark:text-white/90">
                                                    {formatUserName(order.client)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <span className="text-gray-800 dark:text-white/90">
                                                    {formatUserName(order.technician)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {order.equipo.numeroSerie}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <Badge size="sm" color={estaActivo ? "success" : "error"}>
                                                    {order.estadoOrden?.nombre || 'Sin estado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {formatDate(order.fechaPrometidaEntrega)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <div className="flex items-center gap-4">
                                                    {/* Ver */}
                                                    <button
                                                        onClick={() => handleViewClick(order)}
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
                                                        onClick={() => handleEditClick(order)}
                                                        title="Editar"
                                                        aria-label="Editar orden"
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

                                                    {/* Presupuesto */}
                                                    <button
                                                        className="text-purple-500 hover:text-purple-600"
                                                        onClick={() => handleAddBudget(order)}
                                                        title="Presupuesto"
                                                        aria-label="Agregar presupuesto"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>

                                                    {/* Evidencias */}
                                                    <button
                                                        className="text-green-500 hover:text-green-600"
                                                        onClick={() => handleAddEvidence(order)}
                                                        title="Evidencias"
                                                        aria-label="Agregar evidencias"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>

                                                    {/* Actividades */}
                                                    <button
                                                        className="text-blue-400 hover:text-blue-500"
                                                        onClick={() => handleAddActivity(order)}
                                                        title="Actividades"
                                                        aria-label="Agregar actividades"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </button>

                                                    {/* Cambiar Estado */}
                                                    <button
                                                        className="text-orange-500 hover:text-orange-600"
                                                        onClick={() => handleChangeStatus(order)}
                                                        title="Cambiar estado"
                                                        aria-label="Cambiar estado de la orden"
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

                                                    {/* Deshabilitar/Habilitar */}
                                                    <button
                                                        className={estaActivo ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                                                        onClick={() => handleToggleEstado(order)}
                                                        title={estaActivo ? "Deshabilitar" : "Habilitar"}
                                                        aria-label={estaActivo ? "Deshabilitar orden" : "Habilitar orden"}
                                                    >
                                                        {estaActivo ? (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        ) : (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>

                                                    {/* Eliminar (solo admin) */}
                                                    {session?.user.role === 'ADMIN' && (
                                                        <button
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDeleteOrder(order)}
                                                            title="Eliminar"
                                                            aria-label="Eliminar orden"
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
                                onClick={() => fetchOrders(currentPage - 1, 10, searchTerm, showInactive)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => fetchOrders(page, 10, searchTerm, showInactive)}
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
                                onClick={() => fetchOrders(currentPage + 1, 10, searchTerm, showInactive)}
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
                {selectedOrder && (
                    <>
                        <OrdenDetailsModal
                            isOpen={isDetailsModalOpen}
                            onClose={handleCloseModal}
                            order={selectedOrder}
                        />

                        // En el render:
                        <OrdenEditModal
                            isOpen={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                            order={selectedOrder}
                            onSave={handleSaveOrder}
                        />

                        <AddBudgetModal
                            isOpen={isBudgetModalOpen}
                            onClose={handleCloseModal}
                            orderId={selectedOrder.id}
                            onSuccess={() => {
                                fetchOrders(currentPage, 10, searchTerm, showInactive);
                                handleCloseModal();
                            }}
                        />

                        <AddEvidenceModal
                            isOpen={isEvidenceModalOpen}
                            onClose={handleCloseModal}
                            orderId={selectedOrder.id}
                            onSuccess={() => {
                                fetchOrders(currentPage, 10, searchTerm, showInactive);
                                handleCloseModal();
                            }}
                        />

                        {/* <AddActivityModal
              isOpen={isActivityModalOpen}
              onClose={handleCloseModal}
              orderId={selectedOrder.id}
              onSave={(activity) => {
                addActivity(selectedOrder.id, activity);
                fetchOrders(currentPage, 10, searchTerm, showInactive);
                handleCloseModal();
              }}
            />

            <StatusChangeModal
              isOpen={isStatusModalOpen}
              onClose={handleCloseModal}
              currentStatus={selectedOrder.estadoOrden}
              onStatusChange={(newStatusId) => {
                changeOrderStatus(selectedOrder.id, newStatusId);
                fetchOrders(currentPage, 10, searchTerm, showInactive);
                handleCloseModal();
              }}
            /> */}
                    </>
                )}
            </div>
        </div>
    );
}