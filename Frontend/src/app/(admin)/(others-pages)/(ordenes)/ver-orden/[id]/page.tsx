'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PlusIcon, 
  PhotoIcon, 
  DocumentTextIcon, 
  PrinterIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
  ComputerDesktopIcon,
  CheckIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  StarIcon,
  SparklesIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatUserName } from '@/lib/formatters';
import type { Order } from '@/types/order.types';
import { apiRequest } from '@/lib/api';
import { useOrders } from '@/hooks/useOrders';
import { usePresupuesto } from '@/hooks/usePresupuesto';
import ChecklistResultView from '@/components/orden/ChecklistResultView';

// Modales que necesitamos
import OrdenEditModal from "@/components/modals/OrdenEditModal";
import AgregarActividadTecnicaModal from "@/components/modals/AgregarActividadTecnicaModal";
import AgregarEvidenciaTecnicaModal from "@/components/modals/AgregarEvidenciaTecnicaModal";
import GenerarPdfIngresoModal from "@/components/modals/GenerarPdfIngresoModal";
import GenerarPdfEntregaModal from "@/components/modals/GenerarPdfEntregaModal";
import AgregarPresupuestoModal from "@/components/modals/AgregarPresupuestoModal";
import PresupuestoEditModal from "@/components/modals/PresupuestoEditModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";

export default function PerfilOrdenPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { updateOrder } = useOrders();
  const { updatePresupuesto } = usePresupuesto();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActividadModalOpen, setIsActividadModalOpen] = useState(false);
  const [isEvidenciaModalOpen, setIsEvidenciaModalOpen] = useState(false);
  const [isPdfIngresoOpen, setIsPdfIngresoOpen] = useState(false);
  const [isPdfEntregaOpen, setIsPdfEntregaOpen] = useState(false);
  const [isPresupuestoModalOpen, setIsPresupuestoModalOpen] = useState(false);
  const [isEditPresupuestoModalOpen, setIsEditPresupuestoModalOpen] = useState(false);
  
  // Estados para evidencias
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const fetchOrder = async () => {
    if (!id || !session) return;
    try {
      setLoading(true);
      const data = await apiRequest<Order>(`/orders/${id}`, {}, session);
      setOrder(data);
    } catch (error: any) {
      toast.error("Error al cargar la orden");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async (updatedData: any) => {
    try {
      if (!order) return false;
      await updateOrder(order.id, updatedData);
      await fetchOrder();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
      return false;
    }
  };

  const handleDeleteEvidence = async () => {
    if (!deleteConfig.id || !session) return;
    try {
      setIsDeleting(true);
      await apiRequest(`/evidencias-tecnicas/${deleteConfig.id}`, { method: 'DELETE' }, session);
      toast.success("Evidencia eliminada correctamente");
      setDeleteConfig({ isOpen: false, id: null });
      await fetchOrder();
    } catch (error) {
      console.error("Error al eliminar evidencia:", error);
      toast.error("Error al eliminar la evidencia");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePresupuesto = async (updatedPresupuesto: any, shouldClose: boolean = true) => {
    try {
      if (!order?.presupuesto) return;
      // Solo llamar a updatePresupuesto si realmente estamos guardando cambios base (cuando shouldClose es true)
      if (shouldClose) {
        await updatePresupuesto(order.presupuesto.id, {
          estadoId: updatedPresupuesto.estadoId,
          descripcion: updatedPresupuesto.descripcion
        });
      }
      
      await fetchOrder();
      
      if (shouldClose) {
        setIsEditPresupuestoModalOpen(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id, session]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-gray-500 animate-pulse">Cargando detalles de la orden...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ArchiveBoxIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Orden no encontrada</h2>
        <button
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-white shadow-lg hover:bg-brand-700 transition-all"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Volver a la lista
        </button>
      </div>
    );
  }

  const historialOrdenado = order.historialEstados
    ? [...order.historialEstados].sort((a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime())
    : [];

  const STATUS_STEPS = [
    { id: 'recepcion', name: 'Recepción', icon: ArchiveBoxIcon },
    { id: 'diagnostico', name: 'Diagnóstico', icon: MagnifyingGlassIcon },
    { id: 'presupuesto', name: 'Presupuesto', icon: CurrencyDollarIcon },
    { id: 'reparacion', name: 'Reparación', icon: WrenchScrewdriverIcon },
    { id: 'control', name: 'Control', icon: CheckCircleIcon },
    { id: 'entrega', name: 'Entrega', icon: ChevronRightIcon },
    { id: 'archivado', name: 'Completado', icon: StarIcon },
  ];

  // Encontrar el índice del estado actual para la barra de progreso (más robusto)
  const currentStatusName = order.estadoOrden?.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
  
  const currentStepIndex = STATUS_STEPS.findIndex(step => {
    const stepId = step.id;
    if (currentStatusName.includes(stepId)) return true;
    
    // Casos especiales de mapeo
    if (stepId === 'presupuesto' && (currentStatusName.includes('repuesto') || currentStatusName.includes('aprobacion'))) return true;
    if (stepId === 'recepcion' && (currentStatusName.includes('ingresad') || currentStatusName.includes('recibido'))) return true;
    if (stepId === 'entrega' && (currentStatusName.includes('listo') || currentStatusName.includes('finalizad'))) return true;
    if (stepId === 'archivado' && (currentStatusName.includes('archivad') || currentStatusName.includes('entregad'))) return true;
    
    return false;
  });

  const isArchived = currentStatusName.includes('archivad') || currentStatusName.includes('entregad');

  // Si no se encuentra, pero la orden existe, al menos mostrar el primer paso
  const activeIndex = isArchived ? STATUS_STEPS.length - 1 : (currentStepIndex === -1 ? 0 : currentStepIndex);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Top sticky action bar */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              <ArrowLeftIcon className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                ODS-{order.workOrderNumber}
                <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  order.estadoOrden?.nombre.toLowerCase().includes('entrega') 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                }`}>
                  {order.estadoOrden?.nombre || 'Sin estado'}
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Creada por Recepción • {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Actions */}
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            <button 
              onClick={() => setIsActividadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <WrenchScrewdriverIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Actividad</span>
            </button>

            <button 
              onClick={() => order.presupuesto ? setIsEditPresupuestoModalOpen(true) : setIsPresupuestoModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <CurrencyDollarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Presupuesto</span>
            </button>

            <button 
              onClick={() => setIsEvidenciaModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <PhotoIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Subir Evidencia</span>
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

            <button 
              onClick={() => setIsPdfIngresoOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <PrinterIcon className="h-4 w-4" />
              <span className="hidden lg:inline">PDF Ingreso</span>
            </button>
            
            <button 
              onClick={() => setIsPdfEntregaOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span className="hidden lg:inline">PDF Entrega</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Success Banner for Archived Orders */}
        <AnimatePresence>
          {isArchived && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-green-500 p-1 shadow-2xl shadow-brand-500/20"
            >
              <div className="flex items-center justify-between rounded-[22px] bg-white px-8 py-6 dark:bg-gray-900">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <SparklesIcon className="h-10 w-10 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">¡Servicio Completado con Éxito!</h2>
                    <p className="text-gray-500 dark:text-gray-400">Esta orden ha sido finalizada y entregada al cliente. El ciclo está 100% completado.</p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex flex-col items-end">
                    <span className="text-4xl font-black text-brand-600 dark:text-brand-400">100%</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nivel de Progreso</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Stepper with Framer Motion */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 overflow-hidden rounded-3xl bg-white p-8 shadow-lg border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700"
        >
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-6 left-0 h-1.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full" aria-hidden="true">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full shadow-[0_0_20px_rgba(197,242,66,0.6)]"
              ></motion.div>
            </div>

            <ul className="relative flex justify-between w-full">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isCurrent = idx === activeIndex;
                const Icon = step.icon;

                return (
                  <li key={step.id} className="flex flex-col items-center">
                    <div className="relative">
                      {/* Current Step Glowing Effect */}
                      {isCurrent && (
                        <motion.div
                          layoutId="activeGlow"
                          className="absolute inset-0 rounded-full bg-brand-500/30"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 z-10 border-4 ${
                          isCompleted ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20' : 
                          isCurrent ? 'bg-white border-brand-500 text-brand-600 dark:bg-gray-800 shadow-[0_0_20px_rgba(197,242,66,0.4)]' : 
                          'bg-gray-50 border-gray-100 text-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-700'
                        }`}
                      >
                        {isCompleted ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                            <CheckIcon className="h-6 w-6 stroke-[3px]" />
                          </motion.div>
                        ) : (
                          <Icon className={`h-5 w-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                        )}
                      </motion.div>
                    </div>

                    <div className="mt-4 flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        isCurrent ? 'text-brand-600 dark:text-brand-400' : 
                        isCompleted ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'
                      }`}>
                        {step.name}
                      </span>
                      
                      {isCurrent && (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1 flex items-center gap-1.5"
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                          </span>
                          <span className="text-[8px] font-bold text-brand-500 uppercase tracking-tighter">Paso Actual</span>
                        </motion.span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* Main Content Column (3/4) */}
          <div className="space-y-8 lg:col-span-3">
            
            {/* Cliente & Equipo Info Bar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <UserCircleIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Datos del Cliente</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatUserName(order.client)}</h3>
                  <p className="text-sm text-gray-500">{order.client.role === 'client' ? 'Cliente Externo' : 'Usuario Sistema'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <ComputerDesktopIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Equipo en Servicio</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {order.equipo?.tipoEquipo?.nombre} {order.equipo?.marca?.nombre} {order.equipo?.modelo?.nombre}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">SN: {order.equipo?.numeroSerie}</p>
                </div>
              </div>
            </div>

            {/* Problem & Accessories */}
            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-1 bg-brand-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Descripción del Servicio</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Problema Reportado</label>
                  <div className="mt-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50 min-h-[100px] border border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{order.problemaReportado || 'Sin descripción detallada'}"
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-3">Accesorios Entregados</label>
                  <div className="flex flex-wrap gap-2">
                    {order.accesorios && order.accesorios.length > 0 ? (
                      order.accesorios.map((acc, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          <PlusIcon className="h-3 w-3" />
                          {acc}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">No se reportaron accesorios.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Gallery */}
            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-brand-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Evidencias Fotográficas</h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-gray-400">Filtrar por estado:</span>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-900 dark:text-white"
                  >
                    <option value="todos">Todos los estados ({order.evidencias?.length || 0})</option>
                    {order.evidencias && Array.from(new Set(order.evidencias.map(ev => ev.estadoOrden?.nombre).filter(Boolean))).map((statusName) => (
                      <option key={statusName} value={statusName}>
                        {statusName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {order.evidencias && order.evidencias.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {order.evidencias
                    .filter(ev => filterStatus === "todos" || ev.estadoOrden?.nombre === filterStatus)
                    .map((ev, idx) => (
                    <div key={ev.id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-brand-500 transition-all">
                      <img 
                        src={ev.archivoUrl || ev.urlImagen} 
                        alt={`Evidencia ${idx + 1}`} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                        onClick={() => setViewerImage(ev.archivoUrl || ev.urlImagen || null)}
                      />
                      
                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setViewerImage(ev.archivoUrl || ev.urlImagen || null)}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
                          title="Ver imagen"
                        >
                          <EyeIcon className="h-6 w-6" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfig({ isOpen: true, id: ev.id })}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-200 backdrop-blur-sm transition-all"
                          title="Eliminar evidencia"
                        >
                          <TrashIcon className="h-6 w-6" />
                        </button>
                      </div>

                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-white border border-white/10">
                          {ev.estadoOrden?.nombre || 'General'}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-[10px] text-white truncate">{ev.descripcion || 'Sin descripción'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                  <PhotoIcon className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No hay evidencias cargadas todavía.</p>
                </div>
              )}
            </div>

            {/* Peritaje Técnico (Checklist) */}
            {(order.checklistData || (order as any).checklist_template) && (
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-8 w-1 bg-brand-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Peritaje Inicial de Ingreso</h2>
                </div>
                <ChecklistResultView data={order.checklistData || (order as any).checklist_template} />
              </div>
            )}

            {/* Actividades Técnicas Timeline */}
            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-brand-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Actividades Técnicas</h2>
                </div>
                <button 
                  onClick={() => setIsActividadModalOpen(true)}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Registrar Actividad
                </button>
              </div>

              {order.actividades && order.actividades.length > 0 ? (
                <div className="space-y-6">
                  {order.actividades.map((act) => (
                    <div key={act.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-gray-100 dark:before:bg-gray-700 last:before:hidden">
                      <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900"></div>
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/30 transition-all hover:shadow-md">
                        <div className="flex flex-wrap justify-between gap-2 mb-4">
                          <div>
                            <span className="inline-flex items-center rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                              {act.tipoActividad?.nombre}
                            </span>
                            <h4 className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                              Realizado el {formatDate(act.fecha)}
                            </h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Diagnóstico</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              {act.diagnostico}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trabajo Realizado</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              {act.trabajoRealizado}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
                  <p className="text-gray-500 italic">No hay registros de trabajo técnico para esta orden.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column (1/4) */}
          <div className="space-y-8">
            
            {/* Quick Status Info */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Información de Entrega</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Promesa:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDate(order.fechaPrometidaEntrega) || 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Técnico:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatUserName(order.technician) || 'Sin Asignar'}
                  </span>
                </div>
                {order.casillero && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50 p-4 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 border border-brand-100 dark:border-brand-800/50">
                    <ArchiveBoxIcon className="h-8 w-8 opacity-50" />
                    <div>
                      <p className="text-[10px] font-black uppercase">Casillero Asignado</p>
                      <p className="text-xl font-black">{order.casillero.codigo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Presupuesto Summary Widget */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <div className="bg-brand-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CurrencyDollarIcon className="h-6 w-6" />
                  Presupuesto
                </h3>
              </div>
              <div className="p-6">
                {order.presupuesto ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Resumen Financiero</p>
                      <button 
                        onClick={() => setIsEditPresupuestoModalOpen(true)}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors dark:bg-gray-900"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gray-400 tracking-tighter">Estado</span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {order.presupuesto.estado?.nombre}
                      </span>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Descripción General</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                        {order.presupuesto.descripcion || 'Sin descripción adicional.'}
                      </p>
                    </div>
                    
                    {/* Items loop if exist */}
                    {order.presupuesto.detallesPresupuestoItems && order.presupuesto.detallesPresupuestoItems.filter(i => i.estado !== false && !i.deletedAt).length > 0 && (
                      <div className="space-y-2 border-y border-gray-100 py-3 dark:border-gray-700">
                        {order.presupuesto.detallesPresupuestoItems.filter(i => i.estado !== false && !i.deletedAt).map((item) => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-gray-500">{item.cantidad}x {item.parte?.nombre}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${Number(item.subtotal || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mano de obra loop if exist */}
                    {order.presupuesto.detallesManoObra && order.presupuesto.detallesManoObra.filter(i => i.estado !== false && !i.deletedAt).length > 0 && (
                      <div className="space-y-2 pb-3">
                        {order.presupuesto.detallesManoObra.filter(i => i.estado !== false && !i.deletedAt).map((mo) => (
                          <div key={mo.id} className="flex justify-between text-xs">
                            <span className="text-gray-500">{mo.cantidad}x {mo.tipoManoObra?.nombre}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${Number(mo.costoTotal || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}


                    {/* Total Sum */}
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-sm font-black uppercase text-gray-900 dark:text-white">Total Presupuesto</span>
                      <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                        ${(
                          (order.presupuesto.detallesPresupuestoItems?.filter(i => i.estado !== false && !i.deletedAt).reduce((acc, i) => acc + Number(i.subtotal || 0), 0) || 0) +
                          (order.presupuesto.detallesManoObra?.filter(i => i.estado !== false && !i.deletedAt).reduce((acc, i) => acc + Number(i.costoTotal || 0), 0) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500 italic">No hay presupuesto generado.</p>
                    <button 
                      onClick={() => setIsPresupuestoModalOpen(true)}
                      className="mt-3 text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                    >
                      Generar presupuesto ahora
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Timeline (Detailed) */}
            <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                <ArchiveBoxIcon className="h-4 w-4" />
                Historial de Estados
              </h3>
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {historialOrdenado.map((h, eventIdx) => (
                    <li key={h.id}>
                      <div className="relative pb-8">
                        {eventIdx !== historialOrdenado.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-100 dark:bg-gray-700" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-4">
                          <div>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900 ${
                              eventIdx === 0 ? 'bg-brand-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                            }`}>
                              {eventIdx === 0 ? <ChevronRightIcon className="h-4 w-4" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className={`text-sm font-bold ${eventIdx === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                {h.estadoOrden?.nombre}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                                <span className="font-bold text-gray-500 dark:text-gray-400 uppercase">{formatUserName(h.usuario)}</span>
                                <span>•</span>
                                <span>{formatDate(h.fechaCambio)}</span>
                              </div>
                              {h.observaciones && (
                                <div className="mt-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                                    "{h.observaciones}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {/* Evento de creación original */}
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-4">
                        <div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-300 ring-8 ring-white dark:bg-gray-900 dark:ring-gray-900">
                            <PlusIcon className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm font-medium text-gray-400">Orden Iniciada en el Sistema</p>
                            <p className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <OrdenEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        order={order}
        onSave={handleSaveOrder}
      />

      <AgregarActividadTecnicaModal
        isOpen={isActividadModalOpen}
        onClose={() => setIsActividadModalOpen(false)}
        orderId={order.id}
        onSuccess={() => {
          setIsActividadModalOpen(false);
          fetchOrder();
        }}
      />

      <AgregarEvidenciaTecnicaModal
        isOpen={isEvidenciaModalOpen}
        onClose={() => setIsEvidenciaModalOpen(false)}
        orderId={order.id}
        onSuccess={() => {
          setIsEvidenciaModalOpen(false);
          fetchOrder();
        }}
      />

      <GenerarPdfIngresoModal
        isOpen={isPdfIngresoOpen}
        onClose={() => setIsPdfIngresoOpen(false)}
        order={order}
      />

      <GenerarPdfEntregaModal
        isOpen={isPdfEntregaOpen}
        onClose={() => setIsPdfEntregaOpen(false)}
        order={order}
      />

      <AgregarPresupuestoModal
        isOpen={isPresupuestoModalOpen}
        onClose={() => setIsPresupuestoModalOpen(false)}
        orderId={order.id}
        onSuccess={() => {
          setIsPresupuestoModalOpen(false);
          fetchOrder();
        }}
      />

      <PresupuestoEditModal
        isOpen={isEditPresupuestoModalOpen}
        onClose={() => setIsEditPresupuestoModalOpen(false)}
        presupuesto={order.presupuesto as any}
        onSave={handleSavePresupuesto}
      />

      <ConfirmDialog
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig({ isOpen: false, id: null })}
        onConfirm={handleDeleteEvidence}
        title="¿Eliminar evidencia?"
        description="Esta acción eliminará permanentemente la fotografía del sistema y no se puede deshacer."
        destructive
        isLoading={isDeleting}
      />

      {/* Lightbox Viewer */}
      <AnimatePresence>
        {viewerImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setViewerImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewerImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
              <img
                src={viewerImage}
                alt="Vista ampliada"
                className="max-h-[85vh] w-auto rounded-lg shadow-2xl border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
