'use client';

import React, { useState, useEffect } from 'react';
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
  SparklesIcon,
  PhotoIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  BoltIcon,
  KeyIcon,
  LockClosedIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

interface EvidenciaPublica {
  id: number;
  url: string | null;
  tipoArchivo: 'imagen' | 'video';
  mimeType?: string;
  descripcion: string;
  fechaSubida: string;
  estadoNombre: string;
}

interface HistorialItem {
  id: number;
  estadoId?: number;
  estadoNombre: string;
  fecha: string;
  observaciones: string;
}

interface AutorizacionItem {
  id: number;
  decision: string;
  modalidad: string;
  autorizanteNombre: string;
  autorizanteCedula?: string;
  autorizanteParentesco?: string;
  fechaAutorizacion: string;
  hashIntegridad?: string;
  totalPresupuesto: number;
  versionPresupuesto: number;
}

interface PublicOrder {
  id: number;
  workOrderNumber: string;
  tipoOrden?: string;
  problemaReportado: string;
  fechaPrometidaEntrega: string | null;
  accesorios?: string[];
  esperaRepuesto?: boolean;
  tiempoEstimadoReparacion?: number;
  casillero?: { codigo: string } | null;
  tecnico?: { nombre: string } | null;
  estado: boolean;
  createdAt: string;
  tokenVerificado?: boolean;
  cliente: {
    nombre: string;
    apellido: string;
    cedula?: string;
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
  checklistData?: any;
  historial?: HistorialItem[];
  evidencias?: EvidenciaPublica[];
  presupuesto?: {
    id: number;
    version?: number;
    estado: string;
    descripcion: string;
    total: number;
    items: {
      cantidad: number;
      precioUnitario: number;
      nombre: string;
    }[];
    autorizaciones?: AutorizacionItem[];
  } | null;
}

const WORKFLOW_STEPS = [
  { key: 'recepcion', label: 'Recepción', desc: 'Ingreso e inspección', order: 1 },
  { key: 'diagnostico', label: 'Diagnóstico', desc: 'Evaluación de laboratorio', order: 2 },
  { key: 'aprobacion', label: 'Aprobación', desc: 'Presupuesto y repuestos', order: 3 },
  { key: 'reparacion', label: 'Reparación', desc: 'Mantenimiento e intervención', order: 4 },
  { key: 'control', label: 'Control Calidad', desc: 'Pruebas de estrés y verificación', order: 5 },
  { key: 'entrega', label: 'Entrega', desc: 'Listo para retiro / Entregado', order: 6 },
];

function getStepIndexByState(estadoNombre: string = ''): number {
  const norm = estadoNombre.toLowerCase();
  if (norm.includes('recep') || norm.includes('ingreso')) return 0;
  if (norm.includes('diagn') || norm.includes('revis')) return 1;
  if (norm.includes('aprob') || norm.includes('presupuesto')) return 2;
  if (norm.includes('repar') || norm.includes('repuesto') || norm.includes('taller')) return 3;
  if (norm.includes('control') || norm.includes('prueba') || norm.includes('calidad')) return 4;
  if (norm.includes('entreg') || norm.includes('listo') || norm.includes('archiv')) return 5;
  return 0;
}

export default function ConsultaPage() {
  const [cedula, setCedula] = useState('');
  const [workorder, setWorkorder] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<EvidenciaPublica | null>(null);

  // Estados para Autorización Privada Verificada
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDecision, setAuthDecision] = useState<'APROBADO' | 'RECHAZADO'>('APROBADO');
  const [authNombre, setAuthNombre] = useState('');
  const [authCedula, setAuthCedula] = useState('');
  const [authParentesco, setAuthParentesco] = useState('Titular');
  const [authTelefono, setAuthTelefono] = useState('');
  const [authNotas, setAuthNotas] = useState('');
  const [authConsentimiento, setAuthConsentimiento] = useState(true);
  const [showDelegateFields, setShowDelegateFields] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authResult, setAuthResult] = useState<{
    hashIntegridad?: string;
    decision?: string;
    versionPresupuesto?: number;
    message?: string;
  } | null>(null);

  // Auto-cargar parámetros de URL (ej. QR impreso en comprobante físico)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qWorkorder = params.get('workorder') || params.get('orden');
      const qToken = params.get('token');
      const qCedula = params.get('cedula');

      if (qCedula) setCedula(qCedula);
      if (qWorkorder) setWorkorder(qWorkorder);
      if (qToken) setToken(qToken);

      if (qWorkorder && (qCedula || qToken)) {
        doSearch(qCedula || '', qWorkorder, qToken || '');
      }
    }
  }, []);

  const doSearch = async (c: string, w: string, t?: string) => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
      const searchToken = t !== undefined ? t : token;
      let url = `${baseUrl}/orders/public/consulta?cedula=${encodeURIComponent(c)}&workorder=${encodeURIComponent(w)}`;
      if (searchToken.trim()) {
        url += `&token=${encodeURIComponent(searchToken.trim())}`;
      }

      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No se encontró ninguna orden de servicio activa con esa cédula y N° de orden. Por favor verifica los datos ingresados.');
        }
        if (res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'El código de seguridad privado no es válido o ha sido bloqueado por intentos reiterados.');
        }
        throw new Error('Ocurrió un error al consultar la orden. Por favor inténtalo más tarde.');
      }

      const data: PublicOrder = await res.json();
      setOrder(data);

      if (data.cliente) {
        setAuthNombre(`${data.cliente.nombre || ''} ${data.cliente.apellido || ''}`.trim());
      }
      if (c.trim()) {
        setAuthCedula(c.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workorder.trim()) {
      setError('Por favor, ingresa el N° de orden de servicio.');
      return;
    }

    if (!cedula.trim() && !token.trim()) {
      setError('Por favor, ingresa tu número de cédula o el código de seguridad privado.');
      return;
    }

    await doSearch(cedula.trim(), workorder.trim(), token.trim());
  };

  const handleOpenAuthModal = (decision: 'APROBADO' | 'RECHAZADO') => {
    setAuthDecision(decision);
    setAuthConsentimiento(true);
    setAuthNotas('');
    setShowDelegateFields(false);
    if (order?.cliente) {
      const full = `${order.cliente.nombre || ''} ${order.cliente.apellido || ''}`.trim();
      if (full) setAuthNombre(full);
      if (order.cliente.cedula) setAuthCedula(order.cliente.cedula);
    }
    if (cedula.trim() && !authCedula) {
      setAuthCedula(cedula.trim());
    }
    setIsAuthModalOpen(true);
  };

  const handleConfirmPrivateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !order.presupuesto) return;

    if (!token.trim()) {
      setError('Debe proporcionar la Clave de Seguridad que se encuentra impresa en su comprobante físico de recepción.');
      return;
    }

    if (!authNombre.trim() || !authCedula.trim()) {
      setError('El nombre y cédula de quien autoriza son campos obligatorios.');
      return;
    }

    if (!authConsentimiento) {
      setError('Debe marcar la casilla de consentimiento legal para formalizar la autorización.');
      return;
    }

    setAuthSubmitting(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/orders/public/consulta/presupuesto/autorizar-privado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workorder: order.workOrderNumber,
          token: token.trim(),
          action: authDecision === 'APROBADO' ? 'ACEPTADO' : 'RECHAZADO',
          decision: authDecision,
          autorizanteNombre: authNombre.trim(),
          autorizanteIdentificacion: authCedula.trim(),
          autorizanteCedula: authCedula.trim(),
          autorizanteParentesco: authParentesco.trim() || 'Titular',
          autorizanteTelefono: authTelefono.trim() || undefined,
          notas: authNotas.trim() || undefined,
          consentimientoAceptado: true,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Error al procesar la autorización privada.');
      }

      setAuthResult({
        hashIntegridad: resData.data?.hashIntegridad || resData.hashIntegridad,
        decision: resData.data?.decision || (authDecision === 'APROBADO' ? 'ACEPTADO' : 'RECHAZADO'),
        versionPresupuesto: resData.data?.versionPresupuesto || order.presupuesto?.version || 1,
        message: resData.message,
      });

      setIsAuthModalOpen(false);

      // Recargar la orden con el token verificado
      await doSearch(cedula.trim(), order.workOrderNumber, token.trim());
    } catch (err: any) {
      setError(err.message || 'Error desconocido al autorizar');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const currentStepIdx = order ? getStepIndexByState(order.estadoOrden?.nombre) : 0;
  const isExpress = order?.tipoOrden === 'EXPRESS';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 pt-20 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Glow ambient background effects */}
        <div className="absolute top-20 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-80 right-1/4 w-[450px] h-[450px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

        {/* Hero & Search Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold mb-3 shadow-inner">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                <span>Portal Público de Seguimiento Técnico</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Consulta el Estado de tu Equipo
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mt-2 leading-relaxed">
                Ingresa tu número de cédula y el código de tu orden de trabajo para revisar evidencias fotográficas, diagnóstico técnico y estado de entrega en tiempo real.
              </p>
            </div>

            {/* Compact Search Bar on top */}
            <form 
              onSubmit={handleSearch} 
              className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-stretch gap-3 w-full lg:w-auto lg:min-w-[620px]"
            >
              <div className="flex-1 relative">
                <IdentificationIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  id="cedula"
                  type="text"
                  placeholder="N° Cédula (Ej. 1712345678)"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
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
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex-1 relative">
                <KeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  id="token"
                  type="text"
                  placeholder="Clave Privada (Comprobante / QR)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-transparent transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm shrink-0 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-950" />
                    <span>Consultar</span>
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

        {/* Empty State / Welcome Showcase when no order is displayed */}
        {!order && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10"
          >
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <PhotoIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Evidencias Fotográficas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fotografías de alta resolución del diagnóstico de placa, componentes dañados y proceso de ensamblaje en taller.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <ClockIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Seguimiento en Vivo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conoce en qué etapa se encuentra tu equipo: recepción, diagnóstico en banco de pruebas, control de calidad o listo para entrega.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Aprobación Digital</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Revisa el desglose exacto de repuestos y mano de obra con total transparencia. Aprueba o rechaza presupuestos con 1 clic.
              </p>
            </div>
          </motion.div>
        )}

        {/* ORDER RESULT DETAILS VIEW (Full-Width Responsive Dashboard) */}
        {order && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Top Order Hero Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Orden de Trabajo</span>
                      {isExpress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <BoltIcon className="w-3 h-3" /> Express
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <SparklesIcon className="w-3 h-3" /> Completa
                        </span>
                      )}
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                      #{order.workOrderNumber}
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-800 sm:pl-4 space-y-0.5">
                    <div className="text-xs text-slate-400 font-medium">Cliente</div>
                    <div className="text-base sm:text-lg font-bold text-slate-100">
                      {order.cliente.nombre} {order.cliente.apellido}
                    </div>
                    <div className="text-xs text-slate-400">
                      Registrada el {new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="font-black text-sm tracking-wide uppercase">{order.estadoOrden.nombre}</span>
                  </div>

                  {order.tokenVerificado ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                      <span>Acceso Privado Verificado (128-bit)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-xs font-medium">
                      <InformationCircleIcon className="w-4 h-4 text-amber-400" />
                      <span>Modo Consulta Informativa</span>
                    </div>
                  )}

                  {order.casillero && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-slate-300 text-xs font-mono font-bold">
                      <ArchiveBoxIcon className="w-4 h-4 text-amber-400" />
                      <span>Casillero: {order.casillero.codigo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Stepper Workflow */}
              <div className="pt-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Progreso del Servicio en Taller</span>
                  <span className="text-amber-400 font-mono">Paso {currentStepIdx + 1} de {WORKFLOW_STEPS.length}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const isPending = idx > currentStepIdx;

                    return (
                      <div 
                        key={step.key}
                        className={`relative rounded-2xl p-3.5 border transition-all ${
                          isCurrent 
                            ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                            : isCompleted
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                            0{step.order}
                          </span>
                          {isCompleted ? (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          ) : (
                            <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />
                          )}
                        </div>
                        <div className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Widescreen Multi-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left / Center Column (8 Cols on Wide Screen) */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* 1. SECCIÓN DE EVIDENCIAS FOTOGRÁFICAS EN ALTA RESOLUCIÓN */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-amber-400" />
                        <span>Evidencias Fotográficas del Servicio</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                          {order.evidencias?.length || 0}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Fotografías y registros tomados durante el diagnóstico e intervención de laboratorio.
                      </p>
                    </div>

                    {order.evidencias && order.evidencias.length > 0 && (
                      <span className="text-xs text-slate-400 self-start sm:self-center">
                        Clic en cualquier imagen para ampliar
                      </span>
                    )}
                  </div>

                  {order.evidencias && order.evidencias.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {order.evidencias.map((evidencia) => {
                        const isVideo = evidencia.tipoArchivo === 'video' || (evidencia.mimeType && evidencia.mimeType.includes('video'));
                        return (
                          <div
                            key={evidencia.id}
                            onClick={() => evidencia.url && setActivePhotoModal(evidencia)}
                            className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 aspect-video sm:aspect-4/3 flex flex-col justify-end cursor-pointer hover:border-amber-500/60 transition-all shadow-md hover:shadow-xl hover:shadow-amber-500/10"
                          >
                            {evidencia.url ? (
                              isVideo ? (
                                <video 
                                  src={evidencia.url} 
                                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300" 
                                  muted 
                                />
                              ) : (
                                <img
                                  src={evidencia.url}
                                  alt={evidencia.descripcion || `Evidencia orden #${order.workOrderNumber}`}
                                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              )
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                <PhotoIcon className="w-10 h-10" />
                              </div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                            {/* Badge Stage */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-amber-400 border border-slate-700/80 backdrop-blur-md">
                                {evidencia.estadoNombre}
                              </span>
                            </div>

                            {/* Zoom Icon Hover */}
                            <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Caption Footer */}
                            <div className="relative z-10 p-3">
                              <p className="text-xs font-semibold text-white line-clamp-1">
                                {evidencia.descripcion || 'Registro técnico'}
                              </p>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                                <span>{new Date(evidencia.fechaSubida).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                <span className="font-mono text-amber-400">Ver foto</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                        <PhotoIcon className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">Aún no se han publicado fotografías para esta orden</h4>
                      <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                        El especialista técnico subirá fotografías del estado de tu equipo conforme avance la revisión en laboratorio y la colocación de repuestos.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. INSPECCIÓN INICIAL / PERITAJE TÉCNICO DE RECEPCIÓN */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                  <div className="pb-4 border-b border-slate-800/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <CheckBadgeIcon className="w-5 h-5 text-amber-400" />
                        <span>Inspección Inicial de Recepción</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Constatación formal del estado de ingreso registrada en mostrador al recibir el equipo.
                      </p>
                    </div>

                    {order.checklistData?.inspeccionRecepcion?.estadoEncendido && (
                      <div className="flex items-center gap-1.5 self-start sm:self-center">
                        <span className="text-xs text-slate-400">Arranque:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          order.checklistData.inspeccionRecepcion.estadoEncendido === 'correcto'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : order.checklistData.inspeccionRecepcion.estadoEncendido === 'falla'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {order.checklistData.inspeccionRecepcion.estadoEncendido === 'correcto' ? 'Enciende normal' :
                           order.checklistData.inspeccionRecepcion.estadoEncendido === 'falla' ? 'No enciende / Falla' : 'No probado en mostrador'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Accesorios recibidos */}
                  <div className="mb-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Accesorios Recibidos en Custodia
                    </div>
                    {order.accesorios && order.accesorios.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {order.accesorios.map((acc, i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {acc}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No se registraron accesorios adicionales (solo equipo principal).</p>
                    )}
                  </div>

                  {/* Observación de mostrador */}
                  {order.checklistData?.inspeccionRecepcion?.observacionGeneral && (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-6">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <InformationCircleIcon className="w-3.5 h-3.5" /> Observaciones de Recepción
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {order.checklistData.inspeccionRecepcion.observacionGeneral}
                      </p>
                    </div>
                  )}

                  {/* Detalle físico y funcional estructurado si existe */}
                  {order.checklistData?.inspeccionRecepcion?.fisica && order.checklistData.inspeccionRecepcion.fisica.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado Físico</div>
                        <div className="space-y-1.5">
                          {order.checklistData.inspeccionRecepcion.fisica.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs">
                              <span className="text-slate-300 truncate">{item.item}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.estado === 'bueno' ? 'text-emerald-400 bg-emerald-950/40' :
                                item.estado === 'danado' ? 'text-rose-400 bg-rose-950/40' :
                                'text-amber-400 bg-amber-950/40'
                              }`}>
                                {item.estado || 'Revisado'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.checklistData?.inspeccionRecepcion?.funcional && order.checklistData.inspeccionRecepcion.funcional.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pruebas Funcionales</div>
                          <div className="space-y-1.5">
                            {order.checklistData.inspeccionRecepcion.funcional.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs">
                                <span className="text-slate-300 truncate">{item.item}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.estado === 'funciona' || item.estado === 'bueno' ? 'text-emerald-400 bg-emerald-950/40' :
                                  item.estado === 'falla' ? 'text-rose-400 bg-rose-950/40' :
                                  'text-slate-400 bg-slate-800'
                                }`}>
                                  {item.estado === 'funciona' ? 'Operativo' : item.estado === 'falla' ? 'Falla' : 'No probado'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* 3. BITÁCORA Y CRONOLOGÍA DE AVANCES (HISTORIAL) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800/80 mb-6">
                    <ClockIcon className="w-5 h-5 text-amber-400" />
                    <span>Bitácora Cronológica de Avances</span>
                  </h2>

                  {order.historial && order.historial.length > 0 ? (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {order.historial.map((hist, i) => (
                        <div key={hist.id || i} className="relative">
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-slate-950" />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-sm font-bold text-slate-100">
                              {hist.estadoNombre}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {new Date(hist.fecha).toLocaleString('es-ES', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          {hist.observaciones && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {hist.observaciones}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">La orden se encuentra en fase inicial de ingreso.</p>
                  )}
                </div>

              </div>

              {/* Right Column / Sidebar Area (4 Cols on Wide Screen) */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* 1. FICHA TÉCNICA DEL EQUIPO */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <ComputerDesktopIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ficha de Equipo</div>
                      <div className="text-base font-bold text-white">
                        {order.equipo.tipo}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Marca y Modelo</span>
                      <span className="text-slate-200 font-bold text-sm">
                        {order.equipo.marca} {order.equipo.modelo}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Número de Serie (S/N)</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {order.equipo.numeroSerie}
                      </span>
                    </div>

                    {order.tecnico && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-slate-400 block mb-0.5">Especialista a Cargo</span>
                        <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                          {order.tecnico.nombre}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5">Fecha Prometida de Entrega</span>
                      <div className="flex items-center gap-1.5 text-slate-200 font-bold text-sm">
                        <CalendarIcon className="w-4 h-4 text-blue-400" />
                        <span>
                          {order.fechaPrometidaEntrega 
                            ? new Date(order.fechaPrometidaEntrega).toLocaleDateString('es-ES', { dateStyle: 'long' }) 
                            : 'En evaluación de laboratorio'}
                        </span>
                      </div>
                    </div>

                    {order.esperaRepuesto && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        ⚠️ Equipo en espera de repuestos específicos de proveedor.
                      </div>
                    )}
                  </div>

                  {/* Problema Reportado */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Problema Reportado por el Cliente
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {order.problemaReportado}
                    </p>
                  </div>
                </div>

                {/* 2. PRESUPUESTO Y APROBACIÓN VERIFICADA */}
                {order.presupuesto && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Presupuesto Técnico (v{order.presupuesto.version || 1})
                        </div>
                        <div className="text-sm font-bold text-white">Repuestos y Mano de Obra</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.presupuesto.estado?.toLowerCase().includes('aprob') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        order.presupuesto.estado?.toLowerCase().includes('rechaz') ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {order.presupuesto.estado || 'Pendiente'}
                      </span>
                    </div>

                    {/* Aviso de Modo de Acceso y Seguridad */}
                    {order.tokenVerificado ? (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 mb-4">
                        <ShieldCheckIcon className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>Acceso autorizado con comprobante. Listo para responder el presupuesto.</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 mb-4">
                        <InformationCircleIcon className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Modo consulta. Para responder el presupuesto, ingrese la Clave de Seguridad de su comprobante físico al continuar.</span>
                      </div>
                    )}

                    {/* Alerta de Éxito con Huella Criptográfica */}
                    {authResult && (
                      <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs space-y-1.5 mb-4 shadow-lg">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-200">
                          <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                          <span>{authResult.message}</span>
                        </div>
                        {authResult.hashIntegridad && (
                          <div className="font-mono text-[10px] text-slate-400 break-all bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            Hash SHA-256 de Integridad: {authResult.hashIntegridad}
                          </div>
                        )}
                      </div>
                    )}

                    {order.presupuesto.descripcion && (
                      <p className="text-xs text-slate-400 mb-4">{order.presupuesto.descripcion}</p>
                    )}

                    {order.presupuesto.items && order.presupuesto.items.length > 0 && (
                      <div className="overflow-hidden border border-slate-800 rounded-xl mb-4 bg-slate-950">
                        <table className="min-w-full divide-y divide-slate-800 text-xs">
                          <thead className="bg-slate-900/80 text-slate-400">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold">Item</th>
                              <th className="px-2 py-2 text-center font-bold">Cant.</th>
                              <th className="px-3 py-2 text-right font-bold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-300">
                            {order.presupuesto.items.map((it, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-medium">{it.nombre}</td>
                                <td className="px-2 py-2 text-center text-slate-400">{it.cantidad}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-100">
                                  ${(Number(it.cantidad) * Number(it.precioUnitario)).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5">
                      <span className="text-xs font-bold text-slate-300">Total a Pagar</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ${order.presupuesto.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Botones de Aprobación Verificada */}
                    {order.presupuesto.estado && !['aprobado', 'rechazado'].includes(order.presupuesto.estado.toLowerCase()) && (
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAuthModal('APROBADO')}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-2"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Aprobar Presupuesto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAuthModal('RECHAZADO')}
                          className="w-full bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 font-bold py-2 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          <span>Rechazar Presupuesto</span>
                        </button>
                      </div>
                    )}

                    {/* Trazabilidad e Historial de Autorizaciones Inmutables */}
                    {order.presupuesto.autorizaciones && order.presupuesto.autorizaciones.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-800/80">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <DocumentCheckIcon className="w-4 h-4 text-emerald-400" />
                          <span>Historial de Autorizaciones Auditadas</span>
                        </div>
                        <div className="space-y-2">
                          {order.presupuesto.autorizaciones.map((aut, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className={`font-bold ${aut.decision === 'APROBADO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {aut.decision === 'APROBADO' ? '✓ Aprobado' : '✕ Rechazado'} ({aut.modalidad === 'PRESENCIAL' ? 'En Taller Presencial' : 'Digital Remota'})
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(aut.fechaAutorizacion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              <div className="text-slate-300 text-[11px]">
                                Autorizante: <strong>{aut.autorizanteNombre}</strong> {aut.autorizanteParentesco ? `(${aut.autorizanteParentesco})` : ''} — Presupuesto v{aut.versionPresupuesto}
                              </div>
                              {aut.hashIntegridad && (
                                <div className="font-mono text-[9px] text-slate-500 break-all pt-1 border-t border-slate-900">
                                  Sello Criptográfico SHA-256: {aut.hashIntegridad}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CONTACTO DIRECTO POR WHATSAPP CON EL TALLER */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">¿Tienes dudas sobre tu equipo?</h3>
                      <p className="text-[11px] text-slate-400">Atención técnica personalizada</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Comunícate directamente con nuestro equipo de atención por WhatsApp al <strong className="text-emerald-400 font-mono">+593 96 962 0222</strong> indicando tu número de orden.
                  </p>

                  <a
                    href={`https://wa.me/593969620222?text=${encodeURIComponent(`Hola Hospital del Computador, quisiera información sobre el estado de mi orden #${order.workOrderNumber} (${order.equipo.marca} ${order.equipo.modelo}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <span>Consultar por WhatsApp (+593 96 962 0222)</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>

                {/* 4. BANNER DE INICIO DE SESIÓN PARA CLIENTES REGISTRADOS */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    ¿Tienes una cuenta registrada en Hospital del Computador? Inicia sesión para descargar actas digitales en PDF y gestionar todas tus órdenes.
                  </div>
                  <Link
                    href="/signin"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Acceder a Mi Cuenta</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>

            </div>

          </motion.div>
        )}

      </main>

      {/* Modal Lightbox para Visualización en Alta Resolución de Evidencias */}
      <AnimatePresence>
        {activePhotoModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
            onClick={() => setActivePhotoModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {activePhotoModal.estadoNombre}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(activePhotoModal.fechaSubida).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Imagen / Video Content */}
              <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
                {activePhotoModal.url ? (
                  activePhotoModal.tipoArchivo === 'video' ? (
                    <video src={activePhotoModal.url} controls autoPlay className="max-h-[65vh] w-auto rounded-xl object-contain" />
                  ) : (
                    <img
                      src={activePhotoModal.url}
                      alt={activePhotoModal.descripcion || 'Evidencia técnica'}
                      className="max-h-[65vh] w-auto rounded-xl object-contain shadow-2xl"
                    />
                  )
                ) : (
                  <p className="text-slate-500 text-sm">No se pudo cargar la vista previa.</p>
                )}
              </div>

              {/* Footer con descripción */}
              <div className="p-4 px-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-300">
                  {activePhotoModal.descripcion || 'Fotografía de evidencia técnica capturada en taller.'}
                </p>
                {activePhotoModal.url && (
                  <a
                    href={activePhotoModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold shrink-0"
                  >
                    <span>Abrir tamaño original</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Autorización Privada Verificada (Token de 128 bits) */}
      <AnimatePresence>
        {isAuthModalOpen && order && order.presupuesto && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
            onClick={() => !authSubmitting && setIsAuthModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className={`p-5 px-6 text-white flex justify-between items-center ${
                authDecision === 'APROBADO' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
                  : 'bg-gradient-to-r from-rose-600 to-red-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {authDecision === 'APROBADO' ? 'Autorizar Presupuesto' : 'Rechazar Presupuesto'} (Acceso Privado)
                    </h3>
                    <p className="text-xs text-white/80">
                      Orden #{order.workOrderNumber} — Total: ${order.presupuesto.total.toFixed(2)} USD
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  disabled={authSubmitting}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConfirmPrivateAuth} className="p-6 space-y-4 max-h-[calc(85vh-6rem)] overflow-y-auto">
                
                {/* Selector de Decisión */}
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAuthDecision('APROBADO')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        authDecision === 'APROBADO'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Aprobar Trabajos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthDecision('RECHAZADO')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        authDecision === 'RECHAZADO'
                          ? 'bg-rose-500 text-white border-rose-400 font-black shadow-md shadow-rose-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Rechazar Trabajos</span>
                    </button>
                  </div>
                </div>

                {/* Resumen del Presupuesto */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Presupuesto Versión {order.presupuesto.version || 1}
                    </span>
                    <span className="text-xs text-slate-300">
                      Titular: <strong>{authNombre || order.cliente.nombre}</strong> {authCedula ? `(${authCedula})` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono block">
                      ${order.presupuesto.total.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400">Total a autorizar</span>
                  </div>
                </div>

                {/* Si no tiene token cargado, solicitar la clave de seguridad del ticket */}
                {(!token || !token.trim()) && (
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                      Clave de Seguridad del Comprobante *
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                      <input
                        type="text"
                        required
                        placeholder="Código de seguridad impreso en su comprobante o QR"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Este código se encuentra en su comprobante físico de entrega para verificar su identidad.
                    </p>
                  </div>
                )}

                {/* Opción para indicar si autoriza un delegado o familiar */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDelegateFields(!showDelegateFields)}
                    className="text-xs text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>{showDelegateFields ? '▾ Ocultar datos de quien autoriza' : '▸ ¿Autoriza un familiar o tercero delegado?'}</span>
                  </button>

                  {showDelegateFields && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-2 border-t border-slate-800"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={authNombre}
                          onChange={(e) => setAuthNombre(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Cédula / Identificación *
                        </label>
                        <input
                          type="text"
                          required
                          value={authCedula}
                          onChange={(e) => setAuthCedula(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Relación con el Titular
                        </label>
                        <select
                          value={authParentesco}
                          onChange={(e) => setAuthParentesco(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                        >
                          <option value="Titular">Titular del equipo</option>
                          <option value="Cónyuge">Cónyuge / Pareja</option>
                          <option value="Hijo/a">Hijo/a</option>
                          <option value="Familiar">Otro Familiar</option>
                          <option value="Delegado / Empleado">Delegado / Empleado</option>
                          <option value="Otro">Otro autorizado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="text"
                          value={authTelefono}
                          onChange={(e) => setAuthTelefono(e.target.value)}
                          placeholder="099..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Notas adicionales */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Instrucciones o notas adicionales (Opcional)
                  </label>
                  <input
                    type="text"
                    value={authNotas}
                    onChange={(e) => setAuthNotas(e.target.value)}
                    placeholder="Instrucciones para el servicio técnico..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>

                {/* Casilla de Conformidad */}
                <label className="flex items-start gap-2.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={authConsentimiento}
                    onChange={(e) => setAuthConsentimiento(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                  />
                  <span className="text-[11px] text-slate-300 leading-relaxed">
                    Confirmo la {authDecision === 'APROBADO' ? 'aprobación' : 'no aprobación'} de los trabajos y valores detallados en el presupuesto versión {order.presupuesto.version || 1} (${order.presupuesto.total.toFixed(2)} USD).
                  </span>
                </label>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    disabled={authSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                      authDecision === 'APROBADO'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    } disabled:opacity-50`}
                  >
                    {authSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registrando decisión...</span>
                      </>
                    ) : (
                      <>
                        <CheckBadgeIcon className="w-4 h-4" />
                        <span>Confirmar {authDecision === 'APROBADO' ? `Aprobación ($${order.presupuesto.total.toFixed(2)})` : 'Rechazo'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
