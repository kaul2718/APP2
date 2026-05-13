'use client';

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrders } from "@/hooks/useOrders";
import { useEstadoOrden } from "@/hooks/useEstadoOrden";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { useClientes } from "@/hooks/useClientes";
import { useEquipos } from "@/hooks/useEquipos";
import type { Order } from "@/types/order.types";

import OrdenDetailsModal from "@/components/modals/OrdenDetailsModal";
import OrdenEditModal from "@/components/modals/OrdenEditModal";
import AgregarPresupuestoModal from "@/components/modals/AgregarPresupuestoModal";
import PresupuestoDetailsModal from "@/components/modals/PresupuestoDetailsModal";
import AgregarActividadTecnicaModal from "@/components/modals/AgregarActividadTecnicaModal";
import ActividadesPorOrdenModal from "@/components/modals/ActividadesPorOrdenModal";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";

import StateTabsBar from "./StateTabsBar";
import OrdenCard from "./OrdenCard";
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  QueueListIcon,
  DocumentPlusIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

interface UpdateOrderData {
  technicianId?: number | null;
  estadoOrdenId?: number | null;
  problemaReportado?: string;
  fechaPrometidaEntrega?: string | null;
  accesorios?: string[];
  casilleroId?: number | null;
  userId?: number;
}

export default function OrdenListLayout() {
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
    updateOrder,
    estadoOrdenId,
    setEstadoOrdenId,
    clientId,
    setClientId,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
  } = useOrders();

  const { clientes } = useClientes();
  const { equipos } = useEquipos();

  const { data: session } = useSession();
  const { estadosOrden } = useEstadoOrden();
  const userRole = session?.user?.role;
  const canOperateOrders = userRole === "admin" || userRole === "tech" || userRole === "recep";
  const canDeleteOrders = userRole === "admin";

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPresupuestoModalOpen, setIsPresupuestoModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [isPresupuestoDetailsModalOpen, setIsPresupuestoDetailsModalOpen] = useState(false);
  const [presupuestoDetails, setPresupuestoDetails] = useState<{ presupuesto: any; resumen: any } | null>(null);
  const { getPresupuestoByOrderId } = usePresupuesto();

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");
  const [showActividadesModal, setShowActividadesModal] = useState(false);

  const [isEvidenciaModalOpen, setIsEvidenciaModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: "toggle" | "delete" | "advance"; order: Order; nextState?: any } | null>(null);

  const [limit, setLimit] = useState(10);

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

  const handlePresupuestoClick = (order: Order) => {
    setSelectedOrderId(order.id);
    setIsPresupuestoModalOpen(true);
  };

  const handleViewPresupuesto = async (order: Order) => {
    try {
      const details = await getPresupuestoByOrderId(order.id);
      setPresupuestoDetails(details);
      setIsPresupuestoDetailsModalOpen(true);
    } catch (error) {
      toast.error("No se pudo cargar el presupuesto para esta orden");
    }
  };

  const handleSaveOrder = async (updatedData: UpdateOrderData) => {
    try {
      if (!selectedOrder) return false;

      await updateOrder(selectedOrder.id, {
        technicianId: updatedData.technicianId,
        estadoOrdenId: updatedData.estadoOrdenId,
        problemaReportado: updatedData.problemaReportado,
        fechaPrometidaEntrega: updatedData.fechaPrometidaEntrega,
        accesorios: updatedData.accesorios,
        casilleroId: updatedData.casilleroId,
        userId: updatedData.userId,
      });

      await fetchOrders();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
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

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(false);
    setIsActivityModalOpen(false);
    setSelectedOrder(null);
  };

  const handleToggleEstado = async (order: Order) => {
    setConfirmAction({ action: "toggle", order });
  };

  const handleDeleteOrder = async (order: Order) => {
    setConfirmAction({ action: "delete", order });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    const { action, order, nextState } = confirmAction;

    try {
      if (action === "toggle") {
        const estaActivo = order.estado;
        await toggleOrderStatus(order.id);
        toast.success(`Orden ${!estaActivo ? "habilitada" : "deshabilitada"} correctamente`);
      } else if (action === "advance" && nextState) {
        await changeOrderStatus(order.id, nextState.id);
        toast.success(`Orden avanzada a: ${nextState.nombre}`);
      } else {
        await deleteOrder(order.id);
        toast.success("Orden eliminada correctamente");
      }

      fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
    } catch (error) {
      const accion = action === "toggle" ? (order.estado ? "deshabilitar" : "habilitar") : action === "advance" ? "avanzar" : "eliminar";
      toast.error(`Error al ${accion} orden`);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleAdvanceClick = (order: Order) => {
    if (!order.estadoOrden || estadosOrden.length === 0) return;
    
    // Obtenemos todos los estados activos y ordenados
    const activeEstados = estadosOrden.filter(e => e.estado);
    const currentIndex = activeEstados.findIndex(e => e.id === order.estadoOrden?.id);
    
    if (currentIndex >= 0 && currentIndex < activeEstados.length - 1) {
      const nextState = activeEstados[currentIndex + 1];
      setConfirmAction({ action: "advance", order, nextState });
    }
  };

  const buildActions = (order: Order) => {
    const estaActivo = order.estado;
    const tienePresupuesto = Boolean(order.presupuesto);
    const actions: any[] = [
      {
        key: "view",
        label: "Ver",
        icon: <EyeIcon className="h-5 w-5" />,
        onClick: () => handleViewClick(order),
        className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
      },
    ];

    if (tienePresupuesto) {
      actions.push({
        key: "view-budget",
        label: "Ver Presupuesto",
        icon: <CurrencyDollarIcon className="h-5 w-5" />,
        onClick: () => void handleViewPresupuesto(order),
        className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
      });
    }

    actions.push({
      key: "view-activities",
      label: "Actividades",
      icon: <QueueListIcon className="h-5 w-5" />,
      onClick: () => handleViewActivities(order.id, order.workOrderNumber),
      className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
    });

    if (canOperateOrders) {
      actions.push(
        {
          key: "edit",
          label: "Editar",
          icon: <PencilIcon className="h-5 w-5" />,
          onClick: () => handleEditClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
        },
        {
          key: "add-activity",
          label: "Agregar Actividad",
          icon: <DocumentPlusIcon className="h-5 w-5" />,
          onClick: () => handleAddActivity(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
        },
        {
          key: "add-evidence",
          label: "Agregar Evidencia",
          icon: <PhotoIcon className="h-5 w-5" />,
          onClick: () => handleAddEvidencia(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
        },
        {
          key: "toggle",
          label: estaActivo ? "Deshabilitar" : "Habilitar",
          icon: estaActivo ? <NoSymbolIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />,
          onClick: () => void handleToggleEstado(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
        }
      );

      if (!tienePresupuesto) {
        actions.push({
          key: "budget",
          label: "Crear Presupuesto",
          icon: <CurrencyDollarIcon className="h-5 w-5" />,
          onClick: () => handlePresupuestoClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
        });
      }
    }

    if (canDeleteOrders) {
      actions.push({
        key: "delete",
        label: "Eliminar",
        icon: <TrashIcon className="h-5 w-5" />,
        onClick: () => void handleDeleteOrder(order),
        className: "flex items-center justify-center h-10 w-10 rounded-full border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20",
      });
    }

    return actions;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Tabs de Estados */}
      <StateTabsBar 
        estados={estadosOrden}
        activeStateId={estadoOrdenId}
        onStateChange={(id) => setEstadoOrdenId(id)}
        totalCount={totalItems}
      />

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Fila 1: Filtros de Fecha */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fechas:</label>
            <input
              type="date"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={fechaInicio || ""}
              onChange={(e) => setFechaInicio(e.target.value || undefined)}
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={fechaFin || ""}
              onChange={(e) => setFechaFin(e.target.value || undefined)}
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Mostrar</span>
            <select 
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                fetchOrders(1, newLimit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
              }}
              className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>registros</span>
          </div>
        </div>

        {/* Fila 2: Búsqueda y Selectores */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, Cliente o Vehículo..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white md:w-48"
            value={clientId || ""}
            onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Buscar por cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} {c.cedula ? `(${c.cedula})` : ''}</option>
            ))}
          </select>

          {/* Opcional: Filtro por vehículo/equipo si tu backend lo soporta, aunque useOrders no parece tener `equipoId`, lo dejamos comentado o listo. */}
          {/* <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white md:w-48"
          >
            <option value="">Buscar por equipo...</option>
            {equipos.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.numeroSerie}</option>
            ))}
          </select> */}

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-auto">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={() => setShowInactive(!showInactive)}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
            />
            Mostrar inactivos
          </label>
        </div>
      </div>

      {/* 3. Lista de Órdenes (Cards) */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">Cargando órdenes...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No se encontraron órdenes con estos filtros.</div>
        ) : (
          orders.map((order) => {
            const activeEstados = estadosOrden.filter(e => e.estado);
            const currentIndex = activeEstados.findIndex(e => e.id === order.estadoOrden?.id);
            const isLastState = currentIndex !== -1 && currentIndex === activeEstados.length - 1;

            return (
              <OrdenCard 
                key={order.id} 
                order={order} 
                actions={buildActions(order)} 
                primaryActionsCount={6} // Mostrar más acciones primarias para que salgan en línea
                onAdvance={!isLastState ? () => handleAdvanceClick(order) : undefined}
                isLastState={isLastState}
              />
            );
          })
        )}
      </div>

      {/* 4. Paginación */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando registros del {(currentPage - 1) * limit + 1} al {Math.min(currentPage * limit, totalItems)} de un total de {totalItems} registros
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(1, limit, searchTerm, showInactive, estadoOrdenId)}
              disabled={currentPage <= 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Primero
            </button>
            <button
              onClick={() => fetchOrders(currentPage - 1, limit, searchTerm, showInactive, estadoOrdenId)}
              disabled={currentPage <= 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Anterior
            </button>
            <span className="rounded bg-brand-500 px-3 py-1 text-sm font-medium text-white" style={{backgroundColor: '#c5f242', color: '#111827'}}>
              {currentPage}
            </span>
            <button
              onClick={() => fetchOrders(currentPage + 1, limit, searchTerm, showInactive, estadoOrdenId)}
              disabled={currentPage >= totalPages}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Siguiente
            </button>
            <button
              onClick={() => fetchOrders(totalPages, limit, searchTerm, showInactive, estadoOrdenId)}
              disabled={currentPage >= totalPages}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Último
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedOrder && (
        <>
          <OrdenDetailsModal isOpen={isDetailsModalOpen} onClose={handleCloseModal} order={selectedOrder} />
          <OrdenEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            order={selectedOrder}
            onSave={handleSaveOrder}
          />
        </>
      )}

      {isPresupuestoModalOpen && (
        <AgregarPresupuestoModal
          isOpen={isPresupuestoModalOpen}
          onClose={() => {
            setIsPresupuestoModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
          onSuccess={() => {
            toast.success("Presupuesto creado exitosamente");
          }}
        />
      )}

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

      {isActivityModalOpen && (
        <AgregarActividadTecnicaModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            toast.success("Actividad tecnica agregada correctamente");
          }}
          orderId={selectedOrder?.id || null}
        />
      )}

      <ActividadesPorOrdenModal
        isOpen={showActividadesModal}
        onClose={() => setShowActividadesModal(false)}
        orderId={selectedOrderId || 0}
        orderNumber={selectedOrderNumber}
      />

      {isEvidenciaModalOpen && (
        <AgregarEvidenciaTecnicaModal
          isOpen={isEvidenciaModalOpen}
          onClose={() => {
            setIsEvidenciaModalOpen(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            // Sin accion adicional por ahora.
          }}
          orderId={selectedOrder?.id || 0}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.action === "delete"
            ? "Confirmar eliminación de orden"
            : confirmAction?.action === "advance"
            ? "Avanzar Orden"
            : `Confirmar ${confirmAction?.order.estado ? "deshabilitación" : "habilitación"}`
        }
        description={
          confirmAction
            ? confirmAction.action === "delete"
              ? `¿Deseas eliminar la orden #${confirmAction.order.workOrderNumber}?`
              : confirmAction.action === "advance"
              ? `¿Deseas avanzar la orden #${confirmAction.order.workOrderNumber} a la fase de "${confirmAction.nextState?.nombre}"?`
              : `¿Deseas ${confirmAction.order.estado ? "deshabilitar" : "habilitar"} la orden #${confirmAction.order.workOrderNumber}?`
            : ""
        }
        confirmText={confirmAction?.action === "delete" ? "Eliminar" : confirmAction?.action === "advance" ? "Avanzar" : "Confirmar"}
        destructive={confirmAction?.action === "delete"}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
