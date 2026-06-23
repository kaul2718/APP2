'use client';

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrders } from "@/hooks/useOrders";
import { usePermissions } from "@/hooks/usePermissions";
import { useEstadoOrden } from "@/hooks/useEstadoOrden";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { useClientes } from "@/hooks/useClientes";
import { useEquipos } from "@/hooks/useEquipos";
import type { Order } from "@/types/order.types";

import OrdenDetailsModal from "@/components/modals/OrdenDetailsModal";
import OrdenEditModal from "@/components/modals/OrdenEditModal";
import { useRouter } from "next/navigation";
import AgregarPresupuestoModal from "@/components/modals/AgregarPresupuestoModal";
import PresupuestoDetailsModal from "@/components/modals/PresupuestoDetailsModal";
import AgregarActividadTecnicaModal from "@/components/modals/AgregarActividadTecnicaModal";
import ActividadesPorOrdenModal from "@/components/modals/ActividadesPorOrdenModal";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import AsignarCasilleroModal from "@/components/modals/AsignarCasilleroModal";
import GenerarPdfEntregaModal from "@/components/modals/GenerarPdfEntregaModal";
import GenerarPdfIngresoModal from "@/components/modals/GenerarPdfIngresoModal";

import StateTabsBar from "./StateTabsBar";
import OrdenCard from "./OrdenCard";
import Pagination from "@/components/tables/Pagination";
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
  CheckCircleIcon,
  ArchiveBoxIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";

interface UpdateOrderData {
  technicianId?: number | null;
  estadoOrdenId?: number | null;
  problemaReportado?: string;
  fechaPrometidaEntrega?: string | null;
  accesorios?: string[];
  casilleroId?: number | null;
  userId?: number;
  esperaRepuesto?: boolean;
  tiempoEstimadoReparacion?: number;
}

export default function OrdenListLayout() {
  const router = useRouter();
  const fechaInicioId = React.useId();
  const fechaFinId = React.useId();
  const searchId = React.useId();
  const limitId = React.useId();
  const clientIdInputId = React.useId();
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
  const { hasPermission } = usePermissions();
  const { estadosOrden } = useEstadoOrden();
  const canOperateOrders = hasPermission("orders.update");
  const canDeleteOrders = hasPermission("orders.delete");
  
  const sortedEstadosOrden = React.useMemo(() => {
    const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const STATUS_ORDER = [
      "recepcion", 
      "diagnostico", 
      "repuestos", 
      "aprobacion", 
      "reparacion", 
      "control", 
      "entrega", 
      "archivados"
    ];
    return [...estadosOrden].sort((a, b) => {
      const aIdx = STATUS_ORDER.indexOf(normalizeString(a.nombre));
      const bIdx = STATUS_ORDER.indexOf(normalizeString(b.nombre));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [estadosOrden]);

  React.useEffect(() => {
    if (sortedEstadosOrden.length > 0 && estadoOrdenId === undefined) {
      const savedTab = sessionStorage.getItem('lastActiveTab');
      const activeEstados = sortedEstadosOrden.filter(e => e.estado);
      
      if (savedTab && activeEstados.some(e => e.id === Number(savedTab))) {
        setEstadoOrdenId(Number(savedTab));
      } else if (activeEstados.length > 0) {
        setEstadoOrdenId(activeEstados[0].id);
      }
    }
  }, [sortedEstadosOrden, estadoOrdenId, setEstadoOrdenId]);

  React.useEffect(() => {
    if (estadoOrdenId !== undefined) {
      sessionStorage.setItem('lastActiveTab', estadoOrdenId.toString());
    }
  }, [estadoOrdenId]);

  const [lastModifiedOrderId, setLastModifiedOrderId] = useState<number | null>(null);

  React.useEffect(() => {
    const saved = sessionStorage.getItem('lastModifiedOrderId');
    if (saved) setLastModifiedOrderId(Number(saved));
  }, []);

  const updateLastModifiedOrder = (id: number | null) => {
    setLastModifiedOrderId(id);
    if (id) {
      sessionStorage.setItem('lastModifiedOrderId', id.toString());
    } else {
      sessionStorage.removeItem('lastModifiedOrderId');
    }
  };

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
  const [isCasilleroModalOpen, setIsCasilleroModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isIngresoPdfModalOpen, setIsIngresoPdfModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: "toggle" | "delete" | "advance" | "retroceder" | "advance_warning"; order: Order; nextState?: any; prevState?: any; warningType?: "diagnostico" | "presupuesto" | "presupuesto_rechazado" | "presupuesto_pendiente" | "sin_casillero" | "imprimir_acta" } | null>(null);

  const [limit, setLimit] = useState(10);

  const handleAddEvidencia = (order: Order) => {
    setSelectedOrder(order);
    setIsEvidenciaModalOpen(true);
  };

  const handleCasilleroClick = (order: Order) => {
    setSelectedOrder(order);
    setIsCasilleroModalOpen(true);
  };

  const handlePdfClick = (order: Order) => {
    setSelectedOrder(order);
    setIsPdfModalOpen(true);
  };

  const handleIngresoPdfClick = (order: Order) => {
    setSelectedOrder(order);
    setIsIngresoPdfModalOpen(true);
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
    if (Boolean(order.presupuesto)) {
      void handleViewPresupuesto(order);
      return;
    }
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
        esperaRepuesto: updatedData.esperaRepuesto,
        tiempoEstimadoReparacion: updatedData.tiempoEstimadoReparacion,
      });

      updateLastModifiedOrder(selectedOrder.id);
      await fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
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

    const { action, order, nextState, prevState } = confirmAction;

    try {
      if (action === "toggle") {
        const estaActivo = order.estado;
        await toggleOrderStatus(order.id);
        toast.success(`Orden ${!estaActivo ? "habilitada" : "deshabilitada"} correctamente`);
        fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
      } else if ((action === "advance" || action === "advance_warning") && nextState) {
        await changeOrderStatus(order.id, nextState.id);
        toast.success(`Orden avanzada a: ${nextState.nombre}`);
        updateLastModifiedOrder(order.id);
        setEstadoOrdenId(nextState.id);
      } else if (action === "retroceder" && prevState) {
        await changeOrderStatus(order.id, prevState.id);
        toast.success(`Orden retrocedida a: ${prevState.nombre}`);
        updateLastModifiedOrder(order.id);
        setEstadoOrdenId(prevState.id);
      } else {
        await deleteOrder(order.id);
        toast.success("Orden eliminada correctamente");
        fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
      }

    } catch (error) {
      const accion = action === "toggle" ? (order.estado ? "deshabilitar" : "habilitar") : action === "advance" ? "avanzar" : action === "retroceder" ? "retroceder" : "eliminar";
      toast.error(`Error al ${accion} orden`);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleAdvanceClick = (order: Order) => {
    if (!order.estadoOrden || sortedEstadosOrden.length === 0) return;
    
    const estadoNombre = order.estadoOrden.nombre.toLowerCase();
    
    // Validaciones UX (Tarea 4)
    if (estadoNombre.includes('diagn')) {
      const activeEstados = sortedEstadosOrden.filter(e => e.estado);
      const currentIndex = activeEstados.findIndex(e => e.id === order.estadoOrden?.id);
      
      if (currentIndex >= 0 && currentIndex < activeEstados.length - 1) {
        const nextState = activeEstados[currentIndex + 1];
        setConfirmAction({ action: "advance_warning", order, nextState });
      }
      return;
    }
    
    const isPendingDiagnosis = estadoNombre.includes('diagn') && (!order.actividades || order.actividades.length === 0);
    const isPendingBudget = (estadoNombre.includes('repuesto') || estadoNombre.includes('aprob')) && !order.presupuesto;

    // Obtenemos todos los estados activos y ordenados
    const activeEstados = sortedEstadosOrden.filter(e => e.estado);
    const currentIndex = activeEstados.findIndex(e => e.id === order.estadoOrden?.id);
    
    if (currentIndex >= 0 && currentIndex < activeEstados.length - 1) {
      const nextState = activeEstados[currentIndex + 1];

      if (estadoNombre.includes('aprob')) {
        const budgetStatus = order.presupuesto?.estado?.nombre?.toLowerCase() || '';

        if (budgetStatus.includes('rechaz')) {
          const controlState = activeEstados.find(e => e.nombre.toLowerCase().includes('control')) || activeEstados[activeEstados.length - 1];
          setConfirmAction({ action: "advance_warning", order, nextState: controlState, warningType: "presupuesto_rechazado" });
          return;
        }

        if (budgetStatus.includes('pendien')) {
          setConfirmAction({ action: "advance_warning", order, nextState, warningType: "presupuesto_pendiente" });
          return;
        }
      }

      if (estadoNombre.includes('control') || estadoNombre.includes('almac')) {
        if (!order.casillero) {
          setConfirmAction({ action: "advance_warning", order, nextState, warningType: "sin_casillero" });
          return;
        }
      }

      if (estadoNombre.includes('entreg')) {
        setConfirmAction({ action: "advance_warning", order, nextState, warningType: "imprimir_acta" });
        return;
      }

      if (isPendingDiagnosis) {
        setConfirmAction({ action: "advance_warning", order, nextState, warningType: "diagnostico" });
      } else if (isPendingBudget) {
        setConfirmAction({ action: "advance_warning", order, nextState, warningType: "presupuesto" });
      } else {
        setConfirmAction({ action: "advance", order, nextState });
      }
    }
  };

  const handleRetrocederClick = (order: Order) => {
    if (!order.estadoOrden || sortedEstadosOrden.length === 0) return;
    
    const activeEstados = sortedEstadosOrden.filter(e => e.estado);
    const currentIndex = activeEstados.findIndex(e => e.id === order.estadoOrden?.id);
    
    if (currentIndex > 0) {
      const prevState = activeEstados[currentIndex - 1];
      setConfirmAction({ action: "retroceder", order, prevState });
    }
  };

  const buildActions = (order: Order) => {
    const estaActivo = order.estado;
    const tienePresupuesto = Boolean(order.presupuesto);
    const estadoNombre = order.estadoOrden?.nombre.toLowerCase() || '';

    // Lógica para definir acciones primarias
    const isDiagnosticoOrReparacion = estadoNombre.includes('diagn') || estadoNombre.includes('repara');
    const isRepuestosOrAprobacion = estadoNombre.includes('repuesto') || estadoNombre.includes('aprob');
    const isRecepcion = estadoNombre.includes('recep');
    const isControlOrAlmacen = estadoNombre.includes('control') || estadoNombre.includes('almac');

    const actions: any[] = [
      {
        key: "view",
        label: "Ver Perfil ODS",
        icon: <EyeIcon className="h-5 w-5" />,
        onClick: () => router.push(`/ver-orden/${order.id}`), // Cambiado para redirigir a la nueva página
        className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
        isPrimary: true,
      },
    ];



    actions.push({
      key: "view-activities",
      label: "Actividades",
      icon: <QueueListIcon className="h-5 w-5" />,
      onClick: () => handleViewActivities(order.id, order.workOrderNumber),
      className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
      isPrimary: false, // Siempre al menú ... a menos que sea principal
    });

    if (canOperateOrders) {
      actions.push(
        {
          key: "edit",
          label: "Editar",
          icon: <PencilIcon className="h-5 w-5" />,
          onClick: () => handleEditClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
          isPrimary: isRecepcion,
        },
        {
          key: "assign-locker",
          label: "Asignar Casillero",
          icon: <ArchiveBoxIcon className="h-5 w-5" />,
          onClick: () => handleCasilleroClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
          isPrimary: isControlOrAlmacen,
        },
        {
          key: "generate-pdf",
          label: "Generar Acta PDF",
          icon: <PrinterIcon className="h-5 w-5" />,
          onClick: () => handlePdfClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
          isPrimary: estadoNombre.includes('entreg') || estadoNombre.includes('archiv') || isControlOrAlmacen,
        },
        {
          key: "generate-ingreso-pdf",
          label: "Imprimir Comprobante Ingreso",
          icon: <PrinterIcon className="h-5 w-5 text-blue-600" />,
          onClick: () => handleIngresoPdfClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/20",
          isPrimary: isRecepcion,
        },
        {
          key: "add-activity",
          label: "Agregar Actividad",
          icon: <DocumentPlusIcon className="h-5 w-5" />,
          onClick: () => handleAddActivity(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
          isPrimary: isDiagnosticoOrReparacion || estadoNombre.includes('entreg'),
        },
        {
          key: "add-evidence",
          label: "Agregar Evidencia",
          icon: <PhotoIcon className="h-5 w-5" />,
          onClick: () => handleAddEvidencia(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
          isPrimary: isDiagnosticoOrReparacion || isRecepcion || estadoNombre.includes('repuesto') || isControlOrAlmacen || estadoNombre.includes('entreg'),
        },
        {
          key: "toggle",
          label: estaActivo ? "Deshabilitar" : "Habilitar",
          icon: estaActivo ? <NoSymbolIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />,
          onClick: () => void handleToggleEstado(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
          isPrimary: false,
        }
      );

      if (!tienePresupuesto) {
        actions.push({
          key: "budget",
          label: "Crear Presupuesto",
          icon: <CurrencyDollarIcon className="h-5 w-5" />,
          onClick: () => handlePresupuestoClick(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:hover:border-brand-500/30",
          isPrimary: isRepuestosOrAprobacion || estadoNombre.includes('repara') || estadoNombre.includes('diagn') || isRecepcion || estadoNombre.includes('entreg') || isControlOrAlmacen,
        });
      } else {
        actions.push({
          key: "view-budget",
          label: "Ver Presupuesto",
          icon: <CurrencyDollarIcon className="h-5 w-5" />,
          onClick: () => handleViewPresupuesto(order),
          className: "flex items-center justify-center h-10 w-10 rounded-full border border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-900/20",
          isPrimary: isRepuestosOrAprobacion || estadoNombre.includes('repara') || estadoNombre.includes('diagn') || isRecepcion || estadoNombre.includes('entreg') || isControlOrAlmacen,
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
        isPrimary: false,
      });
    }

    return actions;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Tabs de Estados */}
      <StateTabsBar 
        estados={sortedEstadosOrden}
        activeStateId={estadoOrdenId}
        onStateChange={(id) => setEstadoOrdenId(id)}
        totalCount={totalItems}
      />

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Fila 1: Filtros de Fecha */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fechas:</span>
            <label htmlFor={fechaInicioId} className="sr-only">Fecha Inicio</label>
            <input
              id={fechaInicioId}
              type="date"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={fechaInicio || ""}
              onChange={(e) => setFechaInicio(e.target.value || undefined)}
            />
            <span className="text-gray-500">-</span>
            <label htmlFor={fechaFinId} className="sr-only">Fecha Fin</label>
            <input
              id={fechaFinId}
              type="date"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={fechaFin || ""}
              onChange={(e) => setFechaFin(e.target.value || undefined)}
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Mostrar</span>
            <label htmlFor={limitId} className="sr-only">Registros por página</label>
            <select 
              id={limitId}
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
            <label htmlFor={searchId} className="sr-only">Buscar órdenes</label>
            <input
              id={searchId}
              type="text"
              placeholder="Buscar por ID, Cliente o Vehículo..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <label htmlFor={clientIdInputId} className="sr-only">Filtrar por cliente</label>
          <select
            id={clientIdInputId}
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
          (() => {
            const displayOrders = [...orders].sort((a, b) => {
              if (a.id === lastModifiedOrderId) return -1;
              if (b.id === lastModifiedOrderId) return 1;
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            return displayOrders.map((order) => {
              const activeEstados = sortedEstadosOrden.filter(e => e.estado);
              const currentIndex = activeEstados.findIndex(e => e.id === order.estadoOrden?.id);
              const isLastState = currentIndex !== -1 && currentIndex === activeEstados.length - 1;
              const isFirstState = currentIndex === 0;

              return (
                <OrdenCard 
                  key={order.id} 
                  order={order} 
                  actions={buildActions(order)} 
                  primaryActionsCount={6}
                  onAdvance={!isLastState && canOperateOrders ? () => handleAdvanceClick(order) : undefined}
                  onRetroceder={!isFirstState && currentIndex !== -1 && canOperateOrders ? () => handleRetrocederClick(order) : undefined}
                  isLastState={isLastState}
                  isFirstState={isFirstState}
                  isHighlighted={order.id === lastModifiedOrderId}
                />
              );
            });
          })()
        )}
      </div>

      {/* 4. Paginación */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
          <span className="text-sm text-gray-700 dark:text-gray-300">Total: {totalItems}</span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchOrders(page, limit, searchTerm, showInactive, estadoOrdenId)}
          />
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

      {isCasilleroModalOpen && (
        <AsignarCasilleroModal
          isOpen={isCasilleroModalOpen}
          onClose={() => setIsCasilleroModalOpen(false)}
          order={selectedOrder}
          onSave={handleSaveOrder}
        />
      )}

      {isPdfModalOpen && (
        <GenerarPdfEntregaModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          order={selectedOrder}
        />
      )}

      {isIngresoPdfModalOpen && (
        <GenerarPdfIngresoModal
          isOpen={isIngresoPdfModalOpen}
          onClose={() => setIsIngresoPdfModalOpen(false)}
          order={selectedOrder}
        />
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
            if (selectedOrderId) updateLastModifiedOrder(selectedOrderId);
            fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
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
          onSuccess={() => {
            if (presupuestoDetails.presupuesto?.orderId) {
              updateLastModifiedOrder(presupuestoDetails.presupuesto.orderId);
            } else if (selectedOrder) {
              updateLastModifiedOrder(selectedOrder.id);
            }
            fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
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
            // Toast is handled by useCrud
            if (selectedOrder) updateLastModifiedOrder(selectedOrder.id);
            fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
          }}
          orderId={selectedOrder?.id || null}
          workOrderNumber={selectedOrder?.workOrderNumber}
          isDiagnosticoMode={selectedOrder?.estadoOrden?.nombre.toLowerCase().includes('diagn')}
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
            if (selectedOrder) {
              updateLastModifiedOrder(selectedOrder.id);
              fetchOrders(currentPage, limit, searchTerm, showInactive, estadoOrdenId, undefined, clientId, fechaInicio, fechaFin);
            }
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
            : confirmAction?.action === "advance_warning"
            ? (confirmAction.warningType === "presupuesto" ? "Orden sin Presupuesto" : 
               confirmAction.warningType === "presupuesto_rechazado" ? "Presupuesto Rechazado" :
               confirmAction.warningType === "presupuesto_pendiente" ? "Presupuesto Pendiente" : 
               confirmAction.warningType === "sin_casillero" ? "Orden sin Casillero Asignado" : 
               confirmAction.warningType === "imprimir_acta" ? "Finalizar Orden - Imprimir Acta" : "Orden sin Diagnóstico")
            : confirmAction?.action === "retroceder"
            ? "Retroceder Orden"
            : `Confirmar ${confirmAction?.order.estado ? "deshabilitación" : "habilitación"}`
        }
        description={
          confirmAction
            ? confirmAction.action === "delete"
              ? `¿Deseas eliminar la orden #${confirmAction.order.workOrderNumber}?`
              : confirmAction.action === "advance"
              ? `¿Deseas avanzar la orden #${confirmAction.order.workOrderNumber} a la fase de "${confirmAction.nextState?.nombre}"?`
              : confirmAction.action === "advance_warning"
              ? (confirmAction.warningType === "presupuesto"
                  ? `La orden #${confirmAction.order.workOrderNumber} no tiene un presupuesto registrado. ¿Qué deseas hacer?`
                  : confirmAction.warningType === "presupuesto_rechazado"
                  ? `El cliente ha rechazado el presupuesto para la orden #${confirmAction.order.workOrderNumber}. Al avanzar, la orden saltará la fase de Reparación y pasará directamente a "${confirmAction.nextState?.nombre}" para almacenamiento/devolución.`
                  : confirmAction.warningType === "presupuesto_pendiente"
                  ? `El presupuesto de la orden #${confirmAction.order.workOrderNumber} aún está en estado Pendiente. ¿Deseas avanzar a Reparación de todas formas o esperar la respuesta del cliente?`
                  : confirmAction.warningType === "sin_casillero"
                  ? `La orden #${confirmAction.order.workOrderNumber} no tiene un casillero asignado en Control/Almacén. ¿Deseas asignarle un casillero ahora o pasar directamente a la fase de "${confirmAction.nextState?.nombre}" (Entrega)?`
                  : confirmAction.warningType === "imprimir_acta"
                  ? `La orden #${confirmAction.order.workOrderNumber} pasará a su estado final de "${confirmAction.nextState?.nombre}". ¿Deseas imprimir / generar el Acta de Entrega en PDF ahora o pasar directamente al siguiente estado?`
                  : (confirmAction.order.actividades && confirmAction.order.actividades.length > 0
                      ? `¿Deseas avanzar la orden #${confirmAction.order.workOrderNumber} a la fase de "${confirmAction.nextState?.nombre}" o registrar otro diagnóstico?`
                      : `La orden #${confirmAction.order.workOrderNumber} no tiene un diagnóstico registrado. ¿Qué deseas hacer?`))
              : confirmAction.action === "retroceder"
              ? `¿Deseas retroceder la orden #${confirmAction.order.workOrderNumber} a la fase de "${confirmAction.prevState?.nombre}"?`
              : `¿Deseas ${confirmAction.order.estado ? "deshabilitar" : "habilitar"} la orden #${confirmAction.order.workOrderNumber}?`
            : ""
        }
        confirmText={confirmAction?.action === "delete" ? "Eliminar" : confirmAction?.action === "advance" ? "Avanzar" : confirmAction?.action === "retroceder" ? "Retroceder" : "Confirmar"}
        destructive={confirmAction?.action === "delete"}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction(null)}
        customActions={
          confirmAction?.action === "advance_warning" ? (
            confirmAction.warningType === "presupuesto_rechazado" ? (
              <>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Avanzar a Control (Saltar Reparación)
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </>
            ) : confirmAction.warningType === "presupuesto_pendiente" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const orderToUpdate = confirmAction.order;
                    setConfirmAction(null);
                    handlePresupuestoClick(orderToUpdate);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Ver presupuesto
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  Avanzar de todas formas
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </>
            ) : confirmAction.warningType === "sin_casillero" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const orderToUpdate = confirmAction.order;
                    setConfirmAction(null);
                    handleCasilleroClick(orderToUpdate);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Asignar Casillero
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Avanzar a Entrega Directa
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </>
            ) : confirmAction.warningType === "imprimir_acta" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const orderToUpdate = confirmAction.order;
                    setConfirmAction(null);
                    handlePdfClick(orderToUpdate);
                  }}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 flex items-center gap-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Imprimir / Generar Acta PDF
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Avanzar a Archivados
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const orderToUpdate = confirmAction.order;
                    setConfirmAction(null);
                    if (confirmAction.warningType === "presupuesto") {
                      handlePresupuestoClick(orderToUpdate);
                    } else {
                      handleAddActivity(orderToUpdate);
                    }
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {confirmAction.warningType === "presupuesto" ? "Agregar presupuesto" : (confirmAction.order.actividades && confirmAction.order.actividades.length > 0 ? "Agregar otro diagnóstico" : "Agregar diagnóstico")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {confirmAction.warningType === "presupuesto" ? "Avanzar sin presupuesto" : (confirmAction.order.actividades && confirmAction.order.actividades.length > 0 ? "Avanzar" : "Avanzar sin diagnóstico")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </>
            )
          ) : undefined
        }
      />
    </div>
  );
}
