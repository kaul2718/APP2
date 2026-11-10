'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  MagnifyingGlassIcon,
  IdentificationIcon,
  HashtagIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  LockClosedIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PublicOrderSummary {
  workOrderNumber: string;
  tipoEquipo: string;
  marcaModelo?: string | null;
  tipoOrden?: string;
  estadoActual: string;
  estadoStep: number;
  esperaRepuesto?: boolean;
  fechaRecepcion: string;
  fechaUltimaActualizacion: string | null;
  mensajeEstado: string;
}

const WORKFLOW_STEPS = [
  { step: 1, key: 'recepcion', label: 'Recepción', desc: 'Ingreso e inspección inicial' },
  { step: 2, key: 'diagnostico', label: 'Diagnóstico', desc: 'Evaluación técnica y presupuesto' },
  { step: 3, key: 'en_servicio', label: 'En Servicio', desc: 'Intervención técnica en taller' },
  { step: 4, key: 'listo_para_entrega', label: 'Listo para Entrega', desc: 'Disponible para retiro' },
  { step: 5, key: 'entregado', label: 'Entregado', desc: 'Servicio finalizado' },
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/D';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/D';
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${date} · ${time}`;
  } catch {
    return dateStr;
  }
}

export default function ConsultaPage() {
  const [cedula, setCedula] = useState('');
  const [workorder, setWorkorder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrderSummary | null>(null);

  // Auto-cargar parámetros de URL si vienen desde enlace o redirección
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qWorkorder = params.get('workorder') || params.get('orden') || params.get('ods');
      const qCedula = params.get('cedula') || params.get('ci');

      if (qCedula) setCedula(qCedula);
      if (qWorkorder) setWorkorder(qWorkorder);

      if (qWorkorder && qCedula) {
        doSearch(qCedula, qWorkorder);
      }
    }
  }, []);

  const doSearch = async (c: string, w: string) => {
    const cleanCed = c.trim().replace(/[-\s]/g, '');
    const cleanOrd = w.trim();

    if (!cleanCed || cleanCed.length < 8) {
      setError('Por favor, ingresa un número de cédula o identificación válido.');
      setOrder(null);
      return;
    }

    if (!cleanOrd) {
      setError('Por favor, ingresa el número de orden de servicio.');
      setOrder(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
      const url = `${baseUrl}/orders/public/consulta?cedula=${encodeURIComponent(cleanCed)}&workorder=${encodeURIComponent(cleanOrd)}`;

      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No se encontró ninguna orden activa que coincida con la cédula y número de orden ingresados. Por favor verifica tus datos.');
        }
        if (res.status === 429) {
          throw new Error('Has realizado demasiadas consultas seguidas. Por favor espera un momento antes de volver a intentar.');
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Ocurrió un error al consultar el estado de tu equipo. Por favor intenta más tarde.');
      }

      const data: PublicOrderSummary = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSearch(cedula, workorder);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 pt-20 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Glow ambient background effects */}
        <div className="absolute top-20 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-80 right-1/4 w-[450px] h-[450px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

        {/* Hero & Search Header */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold mb-3 shadow-inner">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                <span>Seguimiento Rápido de Orden</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Consulta el estado de tu equipo
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mt-2 leading-relaxed">
                Ingresa tu cédula y número de orden para conocer el estado actual de tu servicio.
              </p>
            </div>

            {/* Formulario de consulta simplificado (2 campos obligatorios: Cédula y N° Orden) */}
            <form
              onSubmit={handleSearch}
              className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-stretch gap-3 w-full lg:w-auto lg:min-w-[540px]"
            >
              <div className="flex-1 relative">
                <IdentificationIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  id="cedula"
                  type="text"
                  placeholder="N° Cédula (Ej. 0601927122)"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex-1 relative">
                <HashtagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  id="workorder"
                  type="text"
                  placeholder="N° Orden (Ej. 00028)"
                  value={workorder}
                  onChange={(e) => setWorkorder(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Consultar estado</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 flex items-center gap-4 text-rose-300 mb-8 shadow-xl"
            >
              <ExclamationCircleIcon className="w-6 h-6 text-rose-400 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-rose-200">No pudimos localizar la orden</p>
                <p className="text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Welcome Showcase */}
        {!order && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10"
          >
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <MagnifyingGlassIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Consulta Inmediata</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Solo necesitas tu número de cédula y el código de orden impreso en tu ticket o comprobante de recepción.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <ClockIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Estado en Tiempo Real</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conoce la fase actual del flujo de servicio técnico: recepción, diagnóstico, presupuesto, reparación o entrega.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Portal de Clientes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para autorizar presupuestos, revisar evidencias o descargar comprobantes con firma electrónica, ingresa a tu cuenta.
              </p>
            </div>
          </motion.div>
        )}

        {/* ORDER RESULT DETAILS VIEW (Exclusivamente información pública permitida) */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Top Order Hero Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Orden de Servicio Técnico
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      {order.workOrderNumber}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        (order.estadoActual || '').toLowerCase().includes('entreg') ||
                        (order.estadoActual || '').toLowerCase().includes('archiv')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          (order.estadoActual || '').toLowerCase().includes('entreg') ||
                          (order.estadoActual || '').toLowerCase().includes('archiv')
                            ? 'bg-emerald-400'
                            : 'bg-amber-400 animate-pulse'
                        }`}
                      />
                      {order.estadoActual}
                    </span>
                    {order.esperaRepuesto && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                        En espera de repuestos
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">{order.tipoEquipo}</strong>
                    {order.marcaModelo && ` · ${order.marcaModelo}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => doSearch(cedula, workorder)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors self-start sm:self-center"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                  <span>Actualizar estado</span>
                </button>
              </div>

              {/* Workflow Stepper de 5 Etapas Oficiales */}
              <div className="pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Progreso del Flujo de Trabajo
                  </p>
                  {order.tipoOrden === 'EXPRESS' && (
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Modalidad Express
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {WORKFLOW_STEPS.map((s) => {
                    const isDelivered = (order.estadoActual || '').toLowerCase().includes('entreg');
                    const isExpressOmittedDiag = order.tipoOrden === 'EXPRESS' && s.key === 'diagnostico' && order.estadoStep >= 3;
                    const isCompleted = isDelivered ? true : isExpressOmittedDiag ? true : order.estadoStep > s.step;
                    const isCurrent = !isDelivered && order.estadoStep === s.step;

                    const labelText = isExpressOmittedDiag ? 'Diagnóstico' : s.label;
                    const descText = isExpressOmittedDiag ? 'Omitido (Flujo Express)' : s.desc;

                    return (
                      <div
                        key={s.key}
                        className={`rounded-2xl p-3 border text-left transition-all relative overflow-hidden ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                            : isCompleted
                            ? 'bg-slate-950/60 border-emerald-500/30'
                            : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isCompleted ? '✓' : s.step}
                          </span>
                          {isCurrent && !order.esperaRepuesto && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
                              En Curso
                            </span>
                          )}
                          {isCurrent && order.esperaRepuesto && s.key === 'en_servicio' && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-yellow-400">
                              En Repuestos
                            </span>
                          )}
                          {isDelivered && s.step === 5 && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                              Entregado
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-amber-300'
                              : isCompleted
                              ? 'text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {labelText}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {descText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resumen Informativo en 3 Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarjeta 1: Mensaje Descriptivo del Estado */}
              <div className="md:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <WrenchScrewdriverIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Situación Actual
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {order.estadoActual}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {order.mensajeEstado}
                </p>
              </div>

              {/* Tarjeta 2: Fecha de Recepción */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <CalendarIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Fecha de Recepción
                  </span>
                </div>
                <p className="text-lg font-bold text-white">
                  {formatDate(order.fechaRecepcion)}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Momento en que el equipo ingresó físicamente al taller técnico.
                </p>
              </div>

              {/* Tarjeta 3: Última Actualización */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ClockIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Última Actualización
                  </span>
                </div>
                <p className="text-lg font-bold text-white">
                  {formatDateTime(order.fechaUltimaActualizacion)}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Registro más reciente del avance técnico en el sistema.
                </p>
              </div>
            </div>

            {/* Enlace discreto hacia el Portal Autenticado del Cliente (Requisito 4) */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    ¿Quieres ver más detalles? Inicia sesión en tu cuenta.
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Ingresa con tu cédula y contraseña personal para consultar el diagnóstico detallado, autorizar presupuestos de repuestos y ver evidencias fotográficas del taller.
                  </p>
                </div>
              </div>

              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-all shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Iniciar Sesión</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
