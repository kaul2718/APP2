'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrders } from "@/hooks/useOrders";
import { Order } from "@/types/order.types";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";

export default function ClientOrderComponent() {
  const { orders, loading, fetchOrders } = useOrders();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);

  const handlePresupuestoAction = async (orderId: number, cedula: string, workorder: string, action: 'ACEPTADO' | 'RECHAZADO') => {
    setActionLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/orders/public/consulta/presupuesto/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula,
          workorder,
          action
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al procesar la acción del presupuesto');
      }

      toast.success(`Presupuesto ${action.toLowerCase()} correctamente.`);
      await fetchOrders(); // Refetch orders to get updated budget status
    } catch (err: any) {
      toast.error(err.message || 'Error desconocido al actualizar el presupuesto');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Cargando tus órdenes..." />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Mis Órdenes de Servicio" />
      
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-800">
          <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tienes órdenes activas</h3>
          <p className="text-gray-500 mt-2">Cuando ingreses un equipo a servicio técnico, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all relative overflow-hidden flex flex-col h-full"
            >
              {/* Decoration line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-400 transform origin-left scale-x-100 transition-transform duration-300 ease-out" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                    <p className="text-[11px] font-black tracking-widest text-brand-600 dark:text-brand-400 uppercase">
                      Orden #{order.workOrderNumber}
                    </p>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    {(order.equipo as any)?.tipoEquipo?.nombre || (order.equipo as any)?.tipo} {((order.equipo as any)?.marca as any)?.nombre || (order.equipo as any)?.marca}
                  </h3>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide border ${
                  order.estadoOrden?.nombre.toLowerCase().includes('entreg') 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                    : order.estadoOrden?.nombre.toLowerCase().includes('repara')
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                }`}>
                  {order.estadoOrden?.nombre || 'Pendiente'}
                </span>
              </div>
              
              <div className="space-y-4 mb-8 flex-grow">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                      <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Diagnóstico / Problema</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium line-clamp-2 leading-relaxed">
                        {order.problemaReportado}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <p>Ingresado el {new Date(order.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full justify-center mt-auto group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:border-brand-200 dark:group-hover:bg-brand-900/20 dark:group-hover:text-brand-300 dark:group-hover:border-brand-800 transition-all" 
                onClick={() => router.push(`/ver-orden/${order.id}`)}
              >
                Ver Detalles
              </Button>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
