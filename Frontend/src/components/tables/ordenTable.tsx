'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import OrdenDetailsModal from "../modals/OrdenDetailsModal";
import OrdenEditModal from "../modals/OrdenEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrders } from "@/hooks/useOrders";
import type { Order } from "@/types/order.types";
import AgregarPresupuestoModal from "@/components/modals/AgregarPresupuestoModal";
import PresupuestoDetailsModal from "@/components/modals/PresupuestoDetailsModal";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import AgregarActividadTecnicaModal from "@/components/modals/AgregarActividadTecnicaModal";
import ActividadesPorOrdenModal from "../modals/ActividadesPorOrdenModal";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { getEstadoColor } from "@/utils/badge-utils";
import { formatDate, formatUserName } from "@/lib/formatters";
import { useEstadoOrden } from "@/hooks/useEstadoOrden";
import { DataTable, ColumnDef } from "./DataTable";

interface UpdateOrderData {
  technicianId?: number | null;
  estadoOrdenId?: number | null;
  problemaReportado?: string;
  fechaPrometidaEntrega?: string | null;
  accesorios?: string[];
  casilleroId?: number | null;
  userId?: number;
}

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
    updateOrder,
    estadoOrdenId,
    setEstadoOrdenId,
  } = useOrders();

  const { data: session } = useSession();
  const { estadosOrden } = useEstadoOrden();

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
  const [confirmAction, setConfirmAction] = useState<{ action: "toggle" | "delete"; order: Order } | null>(null);

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

    const { action, order } = confirmAction;

    try {
      if (action === "toggle") {
        const estaActivo = order.estado;
        await toggleOrderStatus(order.id);
        toast.success(`Orden ${!estaActivo ? "habilitada" : "deshabilitada"} correctamente`);
      } else {
        await deleteOrder(order.id);
        toast.success("Orden eliminada correctamente");
      }

      fetchOrders(currentPage, 10, searchTerm, showInactive, estadoOrdenId);
    } catch (error) {
      const accion = action === "toggle" ? (order.estado ? "deshabilitar" : "habilitar") : "eliminar";
      toast.error(`Error al ${accion} orden`);
    } finally {
      setConfirmAction(null);
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      key: "workOrderNumber",
      header: "N Orden",
      render: (order) => order.workOrderNumber,
    },
    {
      key: "client",
      header: "Cliente",
      render: (order) => formatUserName(order.client),
    },
    {
      key: "technician",
      header: "Tecnico",
      render: (order) => formatUserName(order.technician),
    },
    {
      key: "equipo",
      header: "Equipo",
      render: (order) => order.equipo?.numeroSerie || "N/A",
    },
    {
      key: "estadoOrden",
      header: "Estado",
      render: (order) => (
        <Badge size="sm" color={getEstadoColor(order.estadoOrden?.nombre || "")}>
          {order.estadoOrden?.nombre || "Sin estado"}
        </Badge>
      ),
    },
    {
      key: "fechaPrometidaEntrega",
      header: "Fecha Prometida",
      render: (order) => formatDate(order.fechaPrometidaEntrega),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 p-4 dark:border-white/[0.05]">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6 sm:items-center">
          <div className="flex w-full flex-col gap-3 xs:flex-row sm:gap-4">
            <div className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2">
                <label htmlFor="buscarOrden" className="shrink-0 text-base font-semibold text-gray-700 dark:text-white">
                  Buscar:
                </label>
                <div className="relative flex-1">
                  <input
                    id="buscarOrden"
                    type="text"
                    placeholder="N orden, cliente, equipo..."
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setSearchTerm(valor);
                      fetchOrders(1, 10, valor, showInactive, estadoOrdenId);
                    }}
                    aria-label="Buscar ordenes"
                  />
                  {searchTerm && (
                    <button
                      title="Limpiar busqueda"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => {
                        setSearchTerm("");
                        fetchOrders(1, 10, "", showInactive, estadoOrdenId);
                      }}
                      aria-label="Limpiar busqueda"
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

            <div className="min-w-[180px] flex-1">
              <div className="flex items-center gap-2">
                <label htmlFor="estadoFilter" className="shrink-0 text-base font-semibold text-gray-700 dark:text-white">
                  Estado:
                </label>
                <select
                  id="estadoFilter"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={estadoOrdenId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newEstadoId = value ? Number(value) : undefined;
                    setEstadoOrdenId(newEstadoId);
                    fetchOrders(1, 10, searchTerm, showInactive, newEstadoId);
                  }}
                >
                  <option value="">Todos</option>
                  {estadosOrden
                    .filter((estado) => estado.estado)
                    .map((estado) => (
                      <option key={estado.id} value={estado.id}>
                        {estado.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <label className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => {
                  const nextValue = !showInactive;
                  setShowInactive(nextValue);
                  fetchOrders(1, 10, searchTerm, nextValue, estadoOrdenId);
                }}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
              Mostrar inactivos
            </label>
            <div className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {orders.length} de {totalItems} ordenes
            </div>
          </div>
        </div>
      </div>

      <DataTable
        caption="Tabla de ordenes"
        data={orders}
        columns={columns}
        loading={loading}
        showControls={false}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchOrders(page, 10, searchTerm, showInactive, estadoOrdenId)}
        getRowKey={(order) => order.id}
        actions={(order) => {
          const estaActivo = order.estado;
            const actions = [
              {
                key: "view",
                label: "Ver",
                onClick: () => handleViewClick(order),
                className:
                  "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
              },
              {
                key: "edit",
                label: "Editar",
                onClick: () => handleEditClick(order),
                className:
                  "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
              },
              {
                key: "budget",
                label: "Presupuesto",
                onClick: () => handlePresupuestoClick(order),
                className:
                  "rounded border border-purple-300 px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20",
              },
              {
                key: "view-budget",
                label: "Ver presupuesto",
                onClick: () => void handleViewPresupuesto(order),
              },
              {
                key: "add-activity",
                label: "Agregar actividad",
                onClick: () => handleAddActivity(order),
              },
              {
                key: "view-activities",
                label: "Ver actividades",
                onClick: () => handleViewActivities(order.id, order.workOrderNumber),
              },
              {
                key: "add-evidence",
                label: "Agregar evidencia",
                onClick: () => handleAddEvidencia(order),
              },
              {
                key: "toggle",
                label: estaActivo ? "Deshabilitar" : "Habilitar",
                onClick: () => void handleToggleEstado(order),
              },
            ];

            if (session?.user.role === "admin") {
              actions.push({
                key: "delete",
                label: "Eliminar",
                onClick: () => void handleDeleteOrder(order),
                className:
                  "w-full rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20",
              });
            }

            return actions;
          }}
      />

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

      <ActividadesPorOrdenModal
        isOpen={showActividadesModal}
        onClose={() => setShowActividadesModal(false)}
        orderId={selectedOrderId || 0}
        orderNumber={selectedOrderNumber}
      />

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

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.action === "delete"
            ? "Confirmar eliminación de orden"
            : `Confirmar ${confirmAction?.order.estado ? "deshabilitacion" : "habilitacion"}`
        }
        description={
          confirmAction
            ? confirmAction.action === "delete"
              ? `¿Deseas eliminar la orden #${confirmAction.order.workOrderNumber}?`
              : `¿Deseas ${confirmAction.order.estado ? "deshabilitar" : "habilitar"} la orden #${confirmAction.order.workOrderNumber}?`
            : ""
        }
        confirmText={confirmAction?.action === "delete" ? "Eliminar" : "Confirmar"}
        destructive={confirmAction?.action === "delete"}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
