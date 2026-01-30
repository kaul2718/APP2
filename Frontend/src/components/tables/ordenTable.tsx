'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import OrdenDetailsModal from "../modals/OrdenDetailsModal";
import OrdenEditModal from "../modals/OrdenEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrders } from "@/hooks/useOrders";
import { Order } from "@/interfaces/order";
import AgregarPresupuestoModal from "@/components/modals/AgregarPresupuestoModal";
import PresupuestoDetailsModal from "@/components/modals/PresupuestoDetailsModal";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import AgregarActividadTecnicaModal from "@/components/modals/AgregarActividadTecnicaModal";
import { Button } from "@headlessui/react";
import ActividadesPorOrdenModal from "../modals/ActividadesPorOrdenModal";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";
import { getEstadoColor } from "@/utils/badge-utils";

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
        estadoOrdenId, // Añade esto
        setEstadoOrdenId, // Añade esto

    } = useOrders();

    const { data: session } = useSession();
    const token = session?.accessToken || "";

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isPresupuestoModalOpen, setIsPresupuestoModalOpen] = React.useState(false);
    const [selectedOrderId, setSelectedOrderId] = React.useState<number | null>(null);

    //Detalle Presupuesto
    const [selectedPresupuesto, setSelectedPresupuesto] = useState<any | null>(null);
    const [isPresupuestoDetailsModalOpen, setIsPresupuestoDetailsModalOpen] = useState(false);
    const [presupuestoResumen, setPresupuestoResumen] = useState<any | null>(null);
    const [selectedOrderForPresupuesto, setSelectedOrderForPresupuesto] = useState<Order | null>(null);
    const [presupuestoDetails, setPresupuestoDetails] = useState<{ presupuesto: any, resumen: any } | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const { getPresupuestoByOrderId } = usePresupuesto();


    // Actividades Tecnicas
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");
    const [showActividadesModal, setShowActividadesModal] = useState(false);


    // Evidencicas Tecnicas

    const [isEvidenciaModalOpen, setIsEvidenciaModalOpen] = useState(false);


    const handleAddEvidencia = (order: Order) => {
        setSelectedOrder(order);
        setIsEvidenciaModalOpen(true);
    };


    const handleViewActivities = (orderId: number, orderNumber: string) => {
        setSelectedOrderId(orderId);
        setSelectedOrderNumber(orderNumber);
        setShowActividadesModal(true);
    };

    const handleAddActivity = (order: Order) => {
        setSelectedOrder(order);
        setIsActivityModalOpen(true);
    };

    // Función para manejar la edición
    const handleEdit = (order: Order) => {
        setSelectedOrder(order);
        setEditModalOpen(true);
    };

    const handlePresupuestoCreado = async (nuevoPresupuestoId: number) => {
        // Aquí puedes hacer algo con el ID del nuevo presupuesto si lo necesitas
        toast.success("Presupuesto creado exitosamente");
    };

    const handlePresupuestoClick = (order: any) => {
        setSelectedOrderId(order.id);
        setIsPresupuestoModalOpen(true);
        //console.log("Order ID para presupuesto:", order.id); // Para confirmar
    };

    //FUNCIONO PARA VER PRESUPUESTO
    const handleViewPresupuesto = async (order: Order) => {
        try {
            setSelectedOrderForPresupuesto(order);
            const details = await getPresupuestoByOrderId(order.id);
            setPresupuestoDetails(details);
            setIsPresupuestoDetailsModalOpen(true);
        } catch (error) {
           // console.error("Error al cargar presupuesto:", error);
            toast.error("No se pudo cargar el presupuesto para esta orden");
        }
    };

    // Función para guardar los cambios
    const handleSaveOrder = async (updatedData) => {
        try {
            if (!selectedOrder) return false;

            const response = await updateOrder(selectedOrder.id, {
                technicianId: updatedData.technicianId,
                estadoOrdenId: updatedData.estadoOrdenId,
                problemaReportado: updatedData.problemaReportado,
                fechaPrometidaEntrega: updatedData.fechaPrometidaEntrega,
                accesorios: updatedData.accesorios,
                casilleroId: updatedData.casilleroId,
                userId: updatedData.userId // Asegúrate de que esto se pasa
            });

            await fetchOrders();
            return true;
        } catch (error) {
            //console.error("Error saving order:", error);
            toast.error(error.message || "Error al guardar cambios");
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

    const handleChangeStatus = (order: Order) => {
        setSelectedOrder(order);
        setIsStatusModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(false);
        setIsBudgetModalOpen(false);
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
            //console.error(`Error al ${accion} orden:`, error);
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
           //console.error("Error al eliminar orden:", error);
            toast.error("Error al eliminar orden");
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No especificada';
        return new Date(dateString).toLocaleDateString();
    };

    const formatUserName = (user?: { nombre: string; apellido?: string }) => {
        if (!user) return 'No asignado';
        // Asegurándonos de que tanto nombre como apellido estén definidos
        const nombre = user.nombre || '';
        const apellido = user.apellido || '';
        return `${nombre} ${apellido}`.trim();
    };


    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            {/* Search and Filter Section - Versión compacta y responsive */}
            <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                    {/* Búsqueda y Filtro de Estado en línea */}
                    <div className="w-full flex flex-col xs:flex-row gap-3 sm:gap-4">
                        {/* Campo de Búsqueda */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2">
                                <label htmlFor="buscarOrden" className="shrink-0 text-base font-semibold text-gray-700 dark:text-white">Buscar:</label>
                                <div className="relative flex-1">
                                    <input
                                        id="buscarOrden"
                                        type="text"
                                        placeholder="N° orden, cliente, equipo..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            const valor = e.target.value;
                                            setSearchTerm(valor);
                                            fetchOrders(1, 10, valor, showInactive, estadoOrdenId);
                                        }}
                                        aria-label="Buscar órdenes"
                                    />
                                    {searchTerm && (
                                        <button
                                            title="Limpiar búsqueda"
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            onClick={() => {
                                                setSearchTerm("");
                                                fetchOrders(1, 10, "", showInactive, estadoOrdenId);
                                            }}
                                            aria-label="Limpiar búsqueda"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Selector de Estado */}
                        <div className="flex-1 min-w-[180px]">
                            <div className="flex items-center gap-2">
                                <label htmlFor="estadoFilter" className="shrink-0 text-base font-semibold text-gray-700 dark:text-white">Estado:</label>
                                <select
                                    id="estadoFilter"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={estadoOrdenId || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const newEstadoId = value ? Number(value) : undefined;
                                        setEstadoOrdenId(newEstadoId);
                                        fetchOrders(1, 10, searchTerm, showInactive, newEstadoId);
                                    }}
                                >
                                    <option value="">Todos</option>
                                    <option value="1">Pendiente</option>
                                    <option value="2">En Proceso</option>
                                    <option value="5">Entregado</option>
                                    <option value="6">Espera repuesto</option>
                                    <option value="7">Diagnóstico</option>
                                    <option value="8">Listo para entrega</option>
                                    <option value="9">Cancelado</option>
                                    <option value="10">Irreparable</option>
                                    <option value="11">Reingresado</option>
                                    <option value="12">Recepcionado</option>
                                    <option value="13">Diagnóstico Completo</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Checkbox y contador en línea */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={() => setShowInactive(!showInactive)}
                                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                            Mostrar inactivos
                        </label>
                        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {orders.length} de {totalItems} órdenes
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
                                                <Badge size="sm" color={getEstadoColor(order.estadoOrden?.nombre || "")}>
                                                    {order.estadoOrden?.nombre || "Sin estado"}
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
                                                        onClick={() => handlePresupuestoClick(order)}
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
                                                    {/* Presupuesto Detalles */}
                                                    {/* Ver Presupuesto */}
                                                    <button
                                                        className="text-indigo-500 hover:text-indigo-600"
                                                        onClick={() => handleViewPresupuesto(order)}
                                                        title="Ver presupuesto"
                                                        aria-label="Ver presupuesto"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h.01M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6" />
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

                                                    {/* Ver Presupuesto */}
                                                    <button
                                                        className="text-indigo-500 hover:text-indigo-600"
                                                        onClick={() => handleViewActivities(order.id, order.workOrderNumber)}
                                                        title="Ver Actividades"
                                                        aria-label="Ver Actividades"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h.01M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6" />
                                                        </svg>
                                                    </button>

                                                    {/* Evidencia Técnica */}
                                                    <button
                                                        className="text-green-500 hover:text-green-600"
                                                        onClick={() => handleAddEvidencia(order)}
                                                        title="Evidencia"
                                                        aria-label="Agregar evidencia técnica"
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
                                onClick={() => fetchOrders(currentPage - 1, 10, searchTerm, showInactive, estadoOrdenId)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => fetchOrders(currentPage - 1, 10, searchTerm, showInactive, estadoOrdenId)}
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
                                onClick={() => fetchOrders(currentPage + 1, 10, searchTerm, showInactive, estadoOrdenId)}
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

                        <OrdenEditModal
                            isOpen={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                            order={selectedOrder}
                            onSave={handleSaveOrder}
                        />
                    </>
                )}

                <AgregarPresupuestoModal
                    isOpen={isPresupuestoModalOpen}
                    onClose={() => {
                        setIsPresupuestoModalOpen(false);
                        setSelectedOrderId(null);
                    }}
                    orderId={selectedOrderId}
                    onSuccess={(presupuestoId) => {
                        // Manejo de éxito
                        //console.log("Presupuesto creado:", presupuestoId);
                    }}
                />
                {presupuestoDetails && (
                    <PresupuestoDetailsModal
                        isOpen={isPresupuestoDetailsModalOpen}
                        onClose={() => {
                            setIsPresupuestoDetailsModalOpen(false);
                            setPresupuestoDetails(null);
                        }}
                        presupuesto={presupuestoDetails.presupuesto}
                        resumen={presupuestoDetails.resumen}
                    />
                )}

                {/* Modal de Actividad Técnica */}
                <AgregarActividadTecnicaModal
                    isOpen={isActivityModalOpen}
                    onClose={() => {
                        setIsActivityModalOpen(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={(actividadId) => {
                        toast.success("Actividad técnica agregada correctamente");
                        // Aquí podrías actualizar la lista si es necesario
                    }}
                    orderId={selectedOrder?.id || null}
                />

                <ActividadesPorOrdenModal
                    isOpen={showActividadesModal}
                    onClose={() => setShowActividadesModal(false)}
                    orderId={selectedOrderId || 0}
                    orderNumber={selectedOrderNumber}
                />
                {/* Modal de Evidencia Técnica */}
                <AgregarEvidenciaTecnicaModal
                    isOpen={isEvidenciaModalOpen}
                    onClose={() => {
                        setIsEvidenciaModalOpen(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={() => {
                        //toast.success("Evidencia técnica agregada correctamente");
                        // Puedes actualizar la lista si es necesario
                    }}
                    orderId={selectedOrder?.id || 0}
                />
            </div>
        </div>
    );
}