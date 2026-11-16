'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import {
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  ShieldCheckIcon,
  XMarkIcon,
  BanknotesIcon,
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { ModalidadAutorizacionType } from '@/hooks/usePresupuesto';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  presupuesto: any | null;
  onSuccess: (data: any) => void;
  initialDecision?: 'APROBADO' | 'RECHAZADO';
  initialModalidad?: ModalidadAutorizacionType;
}

const MODALIDADES: Array<{
  id: ModalidadAutorizacionType;
  label: string;
  shortDesc: string;
  requiresSignature: boolean;
  isInternal: boolean;
}> = [
  {
    id: 'CONFIRMACION_TELEFONICA',
    label: 'Confirmación telefónica',
    shortDesc: 'Cliente autoriza o rechaza mediante llamada telefónica',
    requiresSignature: false,
    isInternal: false,
  },
  {
    id: 'CONFIRMACION_MENSAJE_CORREO',
    label: 'Confirmación mediante mensaje o correo',
    shortDesc: 'Cliente confirma por WhatsApp, SMS o correo electrónico',
    requiresSignature: false,
    isInternal: false,
  },
  {
    id: 'AUTORIZACION_INTERNA',
    label: 'Autorización interna del establecimiento',
    shortDesc: 'Decisión operativa interna (no registra aceptación del cliente)',
    requiresSignature: false,
    isInternal: true,
  },
  {
    id: 'PRESENCIAL_FIRMA',
    label: 'Presencial con firma del cliente',
    shortDesc: 'Captura firma táctil en pantalla y genera acta PDF sellada',
    requiresSignature: true,
    isInternal: false,
  },
];

export default function AutorizarPresupuestoPresencialModal({
  isOpen,
  onClose,
  order,
  presupuesto,
  onSuccess,
  initialDecision = 'APROBADO',
  initialModalidad = 'CONFIRMACION_TELEFONICA',
}: Props) {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [decision, setDecision] = useState<'APROBADO' | 'RECHAZADO'>(initialDecision);
  const [modalidad, setModalidad] = useState<ModalidadAutorizacionType>(initialModalidad);
  const [autorizanteNombre, setAutorizanteNombre] = useState('');
  const [autorizanteCedula, setAutorizanteCedula] = useState('');
  const [autorizanteParentesco, setAutorizanteParentesco] = useState('Titular');
  const [autorizanteTelefono, setAutorizanteTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [consentimientoAceptado, setConsentimientoAceptado] = useState(true);

  // Estado del dibujo para modalidad presencial con firma
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);
  const pointsCountRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);

  const requiresSignature = modalidad === 'PRESENCIAL_FIRMA';
  const isInternalAuth = modalidad === 'AUTORIZACION_INTERNA';

  useEffect(() => {
    if (order && isOpen) {
      const client = order.client as any;
      const nombreCompleto = client
        ? `${client.nombre || ''} ${client.apellido || ''}`.trim()
        : '';
      setAutorizanteNombre(nombreCompleto);
      setAutorizanteCedula(client?.cedula || '');
      setAutorizanteTelefono(client?.telefono || '');
      setAutorizanteParentesco('Titular');
      setDecision(initialDecision);
      setModalidad(initialModalidad);
      setObservaciones('');
      setConsentimientoAceptado(true);
      setPointsCount(0);
      pointsCountRef.current = 0;
    }
  }, [order, isOpen, initialDecision, initialModalidad]);

  // Setup Canvas cuando se selecciona la modalidad presencial con firma
  useEffect(() => {
    if (!isOpen || !requiresSignature) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);

      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0f2b61';
      }
    };

    const ro = new ResizeObserver(() => {
      if (pointsCountRef.current === 0) {
        setupCanvas();
      }
    });

    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    setupCanvas();
    const timer = setTimeout(setupCanvas, 150);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [isOpen, requiresSignature]);

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    ctx.clearRect(0, 0, c.width / dpr, c.height / dpr);
    setPointsCount(0);
    pointsCountRef.current = 0;
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const scaleX = (c.width / dpr) / rect.width;
    const scaleY = (c.height / dpr) / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    pointsCountRef.current += 1;
    setPointsCount(pointsCountRef.current);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e) e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    pointsCountRef.current += 1;
    setPointsCount(pointsCountRef.current);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !presupuesto) return;

    let firmaBase64: string | undefined = undefined;

    if (requiresSignature) {
      if (!autorizanteNombre.trim() || !autorizanteCedula.trim()) {
        toast.error('El nombre y cédula de quien autoriza son obligatorios para firma presencial.');
        return;
      }

      if (!consentimientoAceptado) {
        toast.error('Debe marcar la casilla de consentimiento legal para formalizar la firma presencial.');
        return;
      }

      if (pointsCount < 15) {
        toast.warning('Por favor trace la firma manuscrita del cliente en el recuadro táctil.');
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      firmaBase64 = canvas.toDataURL('image/png');
    }

    try {
      setSubmitting(true);
      const payload: Record<string, any> = {
        action: decision === 'APROBADO' ? 'ACEPTADO' : 'RECHAZADO',
        decision,
        modalidad,
        observaciones: observaciones.trim() || undefined,
        notas: observaciones.trim() || undefined,
      };

      if (requiresSignature) {
        payload.autorizanteNombre = autorizanteNombre.trim();
        payload.autorizanteIdentificacion = autorizanteCedula.trim();
        payload.autorizanteCedula = autorizanteCedula.trim();
        payload.autorizanteParentesco = autorizanteParentesco.trim() || 'Titular';
        payload.autorizanteTelefono = autorizanteTelefono.trim() || undefined;
        payload.firmaBase64 = firmaBase64;
        payload.consentimientoAceptado = true;
      } else if (!isInternalAuth) {
        // Confirmación telefónica o mensaje/correo: conserva referencia del titular
        payload.autorizanteNombre = autorizanteNombre.trim() || undefined;
        payload.autorizanteIdentificacion = autorizanteCedula.trim() || undefined;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/presupuesto/autorizar-presencial`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrar la decisión del presupuesto');
      }

      const result = await res.json();
      toast.success(
        requiresSignature
          ? `Presupuesto ${decision === 'APROBADO' ? 'aprobado' : 'rechazado'} con firma presencial registrada.`
          : `Presupuesto ${decision === 'APROBADO' ? 'aprobado' : 'rechazado'} exitosamente.`,
        { autoClose: 3500 },
      );

      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Error registrando decisión de presupuesto:', err);
      toast.error(err.message || 'Error al procesar la decisión del presupuesto');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order || !presupuesto) return null;

  const itemsActivos = (presupuesto.detallesPresupuestoItems || []).filter(
    (i: any) => i.estado !== false && !i.deletedAt,
  );
  const calculatedTotal = itemsActivos.reduce(
    (acc: number, i: any) => acc + Number(i.subtotal || Number(i.precioUnitario || 0) * Number(i.cantidad || 1)),
    0,
  );
  const total = Number(presupuesto.total || presupuesto.costoTotal || calculatedTotal || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showCloseButton={false}
      className="max-w-2xl p-0 overflow-hidden"
    >
      {/* Header */}
      <div
        className={`px-4 sm:px-6 py-3.5 sm:py-4 text-white flex justify-between items-center gap-3 ${
          decision === 'APROBADO'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
            : 'bg-gradient-to-r from-rose-600 to-red-700'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm shrink-0">
            {decision === 'APROBADO' ? (
              <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold break-words">
              {decision === 'APROBADO' ? 'Aprobar Presupuesto' : 'Rechazar Presupuesto'}
            </h2>
            <p className="text-xs text-white/80">
              Orden #{order.workOrderNumber} — Presupuesto v{presupuesto.version || 1} (${total.toFixed(2)})
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Cerrar modal"
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 max-h-[calc(88dvh-5rem)] overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/50"
      >
        {/* Resumen Económico Compacto */}
        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <BanknotesIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                Monto Total Presupuestado
              </p>
              <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white font-mono">
                ${total.toFixed(2)} USD
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Versión {presupuesto.version || 1}
          </span>
        </div>

        {/* 1. Selector de Decisión */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            1. Resultado
          </label>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDecision('APROBADO')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                decision === 'APROBADO'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <CheckIcon className="w-4 h-4 shrink-0" />
              <span>Aprobar Presupuesto</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('RECHAZADO')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                decision === 'RECHAZADO'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <XMarkIcon className="w-4 h-4 shrink-0" />
              <span>Rechazar Presupuesto</span>
            </button>
          </div>
        </div>

        {/* 2. Selector de Modalidad de Autorización */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            2. Modalidad de Autorización
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODALIDADES.map((mod) => {
              const selected = modalidad === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setModalidad(mod.id)}
                  className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                    selected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {mod.id === 'CONFIRMACION_TELEFONICA' && <PhoneIcon className="w-4 h-4" />}
                    {mod.id === 'CONFIRMACION_MENSAJE_CORREO' && <ChatBubbleLeftRightIcon className="w-4 h-4" />}
                    {mod.id === 'AUTORIZACION_INTERNA' && <BuildingStorefrontIcon className="w-4 h-4" />}
                    {mod.id === 'PRESENCIAL_FIRMA' && <PencilSquareIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold leading-snug ${
                        selected ? 'text-blue-900 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {mod.label}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                      {mod.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aviso de distinción cuando es Autorización Interna */}
        {isInternalAuth && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
            <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Autorización interna del establecimiento:</strong> Se registrará bajo su usuario sin atribuir aceptación ni firma al cliente.
            </span>
          </div>
        )}

        {/* 3. Observación / Constancia */}
        <div>
          <label
            htmlFor="presupuesto-observaciones"
            className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
          >
            3. Observación / Constancia (Opcional)
          </label>
          <textarea
            id="presupuesto-observaciones"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder={
              modalidad === 'CONFIRMACION_TELEFONICA'
                ? 'Ej. Cliente confirma aprobación vía llamada telefónica...'
                : modalidad === 'CONFIRMACION_MENSAJE_CORREO'
                ? 'Ej. Cliente confirma por WhatsApp al número del taller...'
                : modalidad === 'AUTORIZACION_INTERNA'
                ? 'Ej. Autorizado internamente por recepción / gerencia técnica...'
                : 'Ej. Cliente firma en mostrador...'
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Sección exclusiva para Modalidad Presencial con Firma */}
        {requiresSignature && (
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Datos de la Persona que Autoriza */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-blue-600" />
                Persona que Firma en Mostrador
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    Nombre y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={autorizanteNombre}
                    onChange={(e) => setAutorizanteNombre(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    Cédula / Pasaporte *
                  </label>
                  <input
                    type="text"
                    required
                    value={autorizanteCedula}
                    onChange={(e) => setAutorizanteCedula(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    Relación con el Titular
                  </label>
                  <select
                    value={autorizanteParentesco}
                    onChange={(e) => setAutorizanteParentesco(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Titular">Titular del equipo</option>
                    <option value="Cónyuge">Cónyuge / Pareja</option>
                    <option value="Hijo/a">Hijo/a</option>
                    <option value="Familiar">Otro Familiar</option>
                    <option value="Delegado / Empleado">Delegado / Empleado de empresa</option>
                    <option value="Otro">Otro autorizado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={autorizanteTelefono}
                    onChange={(e) => setAutorizanteTelefono(e.target.value)}
                    placeholder="099..."
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Lienzo de Firma Manuscrita Táctil */}
            <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2 shadow-sm">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PencilSquareIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  Firma Manuscrita del Cliente (Lienzo Táctil) *
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Limpiar Firma
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white overflow-hidden relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="w-full h-40 cursor-crosshair touch-none block"
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                />
                {pointsCount === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs font-medium">
                    Trace la firma aquí
                  </div>
                )}
              </div>
            </div>

            {/* Casilla de Consentimiento Legal */}
            <label className="flex items-start gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentimientoAceptado}
                onChange={(e) => setConsentimientoAceptado(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>Consentimiento Informado:</strong> En mi calidad de autorizante, declaro que he revisado el presupuesto técnico versión {presupuesto.version || 1} por ${total.toFixed(2)} USD, autorizando a Hospital del Computador a proceder conforme a la decisión indicada.
              </span>
            </label>
          </div>
        )}

        {/* Botones de Envío */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
              decision === 'APROBADO'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            } disabled:opacity-50`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-5 h-5" />
                <span>
                  {decision === 'APROBADO' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
