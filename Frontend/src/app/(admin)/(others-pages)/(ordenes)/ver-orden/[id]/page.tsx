'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatDate, formatUserName } from '@/lib/formatters';
import type { Order, OrderHistorialEstado } from '@/types/order.types';
import { apiRequest } from '@/lib/api';

export default function PerfilOrdenPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchOrder();
  }, [id, session]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Orden no encontrada</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
      </div>
    );
  }

  // Ordenamos el historial de más nuevo a más antiguo para el timeline
  const historialOrdenado = order.historialEstados 
    ? [...order.historialEstados].sort((a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime())
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-white p-2 text-gray-500 shadow-sm hover:bg-gray-50 hover:text-brand-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-brand-400"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orden #{order.workOrderNumber}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingresada el {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            {order.estadoOrden?.nombre || 'Sin estado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Info Card */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800/50">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información General</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">
                    {formatUserName(order.client)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Técnico Asignado</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {formatUserName(order.technician) || 'No asignado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Equipo</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {order.equipo?.tipoEquipo?.nombre} {order.equipo?.marca?.nombre} {order.equipo?.modelo?.nombre}
                  </p>
                  <p className="text-sm text-gray-500">SN: {order.equipo?.numeroSerie}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promesa de Entrega</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {formatDate(order.fechaPrometidaEntrega) || 'No definida'}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Problema Reportado</p>
                <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {order.problemaReportado || 'Sin descripción'}
                  </p>
                </div>
              </div>

              {order.accesorios && order.accesorios.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accesorios</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {order.accesorios.map((acc, idx) => (
                      <span key={idx} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actividades Técnicas */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800/50">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actividades Técnicas</h2>
            </div>
            <div className="p-6">
              {order.actividades && order.actividades.length > 0 ? (
                <div className="space-y-4">
                  {order.actividades.map((act) => (
                    <div key={act.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">{act.tipoActividad?.nombre}</span>
                        <span className="text-xs text-gray-500">{formatDate(act.fecha)}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="font-medium text-gray-500">Diagnóstico:</span>
                          <p className="text-gray-700 dark:text-gray-300">{act.diagnostico}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Trabajo:</span>
                          <p className="text-gray-700 dark:text-gray-300">{act.trabajoRealizado}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay actividades técnicas registradas.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Presupuesto */}
        <div className="space-y-6">
          {/* Presupuesto Summary */}
          {order.presupuesto && (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800/50">
              <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Presupuesto</h2>
              </div>
              <div className="p-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Estado:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{order.presupuesto.estado?.nombre}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-500">Fecha:</span>
                  <span className="text-gray-900 dark:text-gray-300">{formatDate(order.presupuesto.fechaEmision)}</span>
                </div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900/50">
                  <p className="text-gray-700 dark:text-gray-300">{order.presupuesto.descripcion || 'Sin descripción'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800/50">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial (Timeline)</h2>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {historialOrdenado.map((h, eventIdx) => (
                    <li key={h.id}>
                      <div className="relative pb-8">
                        {eventIdx !== historialOrdenado.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 ring-8 ring-white dark:bg-brand-900/50 dark:ring-gray-800/50">
                              <span className="h-2.5 w-2.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {h.estadoOrden?.nombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                por {formatUserName(h.usuario)}
                              </p>
                              {h.observaciones && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {h.observaciones}
                                </p>
                              )}
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-gray-500">
                              {formatDate(h.fechaCambio)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {/* First Event (Creation) */}
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-800 dark:ring-gray-800/50">
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Orden Creada</p>
                            <p className="text-xs text-gray-400">por Recepción</p>
                          </div>
                          <div className="whitespace-nowrap text-right text-xs text-gray-500">
                            {formatDate(order.createdAt)}
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
    </div>
  );
}
