'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  IdentificationIcon, 
  HashtagIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  CalendarIcon, 
  WrenchScrewdriverIcon, 
  ArrowRightIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface PublicOrder {
  id: number;
  workOrderNumber: string;
  problemaReportado: string;
  fechaPrometidaEntrega: string | null;
  estado: boolean;
  createdAt: string;
  cliente: {
    nombre: string;
    apellido: string;
  };
  equipo: {
    tipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
  };
  estadoOrden: {
    id: number;
    nombre: string;
  };
  presupuesto?: {
    id: number;
    estado: string;
    descripcion: string;
    total: number;
    items: {
      cantidad: number;
      precioUnitario: number;
      nombre: string;
    }[];
  } | null;
}

export default function ConsultaPage() {
  const [cedula, setCedula] = useState('');
  const [workorder, setWorkorder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePresupuestoAction = async (action: 'ACEPTADO' | 'RECHAZADO') => {
    setActionLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/orders/public/consulta/presupuesto/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: cedula.trim(),
          workorder: workorder.trim(),
          action
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al procesar la acción del presupuesto');
      }

      // Refresh order data
      handleSearch(new Event('submit') as any);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cedula.trim() || !workorder.trim()) {
      setError('Por favor, ingresa tanto el número de cédula como el N° de orden.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/orders/public/consulta?cedula=${encodeURIComponent(cedula.trim())}&workorder=${encodeURIComponent(workorder.trim())}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No se encontró ninguna orden de servicio con esa cédula y N° de orden.');
        }
        throw new Error('Ocurrió un error al consultar la orden. Inténtalo más tarde.');
      }

      const data: PublicOrder = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-amber-500 selection:text-gray-900 pt-20 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold mb-4 shadow-inner">
            <SparklesIcon className="w-4 h-4" />
            <span>Hospital del Computador - Acceso Rápido</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Consulta el Estado de tu Equipo
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Ingresa tu identificación y el código de tu orden de trabajo para ver los avances técnicos al instante sin requerir contraseña.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-50 dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-gray-200 dark:border-gray-700/80 shadow-xl dark:shadow-2xl mb-12"
        >
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            
            <div>
              <label htmlFor="cedula" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <IdentificationIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Número de Cédula</span>
              </label>
              <input
                id="cedula"
                type="text"
                placeholder="Ej. 1712345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full bg-white dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="workorder" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <HashtagIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>N° de Orden de Trabajo (WorkOrder)</span>
              </label>
              <input
                id="workorder"
                type="text"
                placeholder="Ej. 00001"
                value={workorder}
                onChange={(e) => setWorkorder(e.target.value)}
                className="w-full bg-white dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-900 font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-amber-500/20 dark:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-900" />
                    <span className="text-base">Consultar Estado</span>
                  </>
                )}
              </motion.button>
            </div>

          </form>
        </motion.div>

        <AnimatePresence>
          {/* Error Alert */}
          {error && (
            <motion.div 
              key="error-alert"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-6 flex items-center space-x-4 text-rose-700 dark:text-rose-400 mb-12 shadow-md"
            >
              <ExclamationCircleIcon className="w-7 h-7 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold">No se pudo realizar la consulta</p>
                <p className="text-rose-600 dark:text-rose-300/80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Result Card */}
          {order && (
            <motion.div 
              key="result-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="space-y-8"
            >
              
              <div className="bg-white dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-gray-200 dark:border-gray-700/80 shadow-xl dark:shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700/80 mb-6">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Orden de Trabajo</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">#{order.workOrderNumber}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Cliente: {order.cliente.nombre} {order.cliente.apellido}</div>
                  </div>

                  <div className="flex items-center space-x-3 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400 self-start sm:self-center">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-wide">{order.estadoOrden.nombre}</span>
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  
                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                      <WrenchScrewdriverIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Equipo en Reparación</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 dark:text-white pt-1">
                      {order.equipo.tipo} {order.equipo.marca} {order.equipo.modelo}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">S/N: {order.equipo.numeroSerie}</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                      <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Fecha Prometida de Entrega</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 dark:text-white pt-1">
                      {order.fechaPrometidaEntrega 
                        ? new Date(order.fechaPrometidaEntrega).toLocaleDateString('es-ES', { dateStyle: 'long' }) 
                        : 'Fecha pendiente de confirmación'}
                    </div>
                  </div>

                </div>

                {/* Problema Reportado */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 mb-8">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Problema Reportado</div>
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{order.problemaReportado}</p>
                </div>

                {/* Presupuesto */}
                {order.presupuesto && (
                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Detalle del Presupuesto</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.presupuesto.estado?.toLowerCase() === 'aprobado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        order.presupuesto.estado?.toLowerCase() === 'rechazado' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {order.presupuesto.estado || 'Pendiente'}
                      </span>
                    </div>

                    {order.presupuesto.descripcion && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{order.presupuesto.descripcion}</p>
                    )}

                    {order.presupuesto.items && order.presupuesto.items.length > 0 && (
                      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl mb-4">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cant.</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {order.presupuesto.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.nombre}</td>
                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.cantidad}</td>
                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">${Number(item.precioUnitario).toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-medium">${(Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6">
                      <span className="font-bold text-gray-700 dark:text-gray-300">Total a Pagar</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">${order.presupuesto.total.toFixed(2)}</span>
                    </div>

                    {order.presupuesto.estado && !['Aprobado', 'Rechazado'].includes(order.presupuesto.estado) && (
                      <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <button
                          onClick={() => handlePresupuestoAction('ACEPTADO')}
                          disabled={actionLoading}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          Aceptar Presupuesto
                        </button>
                        <button
                          onClick={() => handlePresupuestoAction('RECHAZADO')}
                          disabled={actionLoading}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                        >
                          Rechazar Presupuesto
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Advanced Info Banner / CTA Login */}
              <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-blue-50 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-blue-950/40 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-8 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg dark:shadow-xl">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start space-x-2">
                    <SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>¿Deseas ver más detalles sobre tu orden?</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                    Inicia sesión para revisar el presupuesto de repuestos, ver fotos del diagnóstico técnico en alta resolución y chatear directamente con el especialista a cargo.
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/signin"
                    className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl text-sm font-bold text-gray-900 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-md shadow-amber-500/20 dark:shadow-amber-500/30 flex-shrink-0"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <Footer />
    </div>
  );
}
