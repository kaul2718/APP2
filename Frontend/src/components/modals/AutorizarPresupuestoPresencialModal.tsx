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
  DocumentTextIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  presupuesto: any | null;
  onSuccess: (data: any) => void;
}

export default function AutorizarPresupuestoPresencialModal({
  isOpen,
  onClose,
  order,
  presupuesto,
  onSuccess,
}: Props) {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [decision, setDecision] = useState<'APROBADO' | 'RECHAZADO'>('APROBADO');
  const [autorizanteNombre, setAutorizanteNombre] = useState('');
  const [autorizanteCedula, setAutorizanteCedula] = useState('');
  const [autorizanteParentesco, setAutorizanteParentesco] = useState('Titular');
  const [autorizanteTelefono, setAutorizanteTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [consentimientoAceptado, setConsentimientoAceptado] = useState(false);

  // Estado del dibujo
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);
  const pointsCountRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);

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
      setDecision('APROBADO');
      setNotas('');
      setConsentimientoAceptado(true);
      setPointsCount(0);
      pointsCountRef.current = 0;
    }
  }, [order, isOpen]);

  // Setup Canvas
  useEffect(() => {
    if (!isOpen) return;

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

    const timer = setTimeout(setupCanvas, 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setPointsCount(0);
    pointsCountRef.current = 0;
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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

    if (!autorizanteNombre.trim() || !autorizanteCedula.trim()) {
      toast.error('El nombre y cédula de quien autoriza son obligatorios.');
      return;
    }

    if (!consentimientoAceptado) {
      toast.error('Debe marcar la casilla de consentimiento legal para formalizar la autorización.');
      return;
    }

    if (pointsCount < 15) {
      toast.warning('Por favor trace la firma manuscrita del cliente en el recuadro táctil.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const firmaBase64 = canvas.toDataURL('image/png');

    try {
      setSubmitting(true);
      const payload = {
        action: decision === 'APROBADO' ? 'ACEPTADO' : 'RECHAZADO',
        decision,
        autorizanteNombre: autorizanteNombre.trim(),
        autorizanteIdentificacion: autorizanteCedula.trim(),
        autorizanteCedula: autorizanteCedula.trim(),
        autorizanteParentesco: autorizanteParentesco.trim() || 'Titular',
        autorizanteTelefono: autorizanteTelefono.trim() || undefined,
        firmaBase64,
        notas: notas.trim() || undefined,
        consentimientoAceptado: true,
      };

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
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al procesar la autorización presencial');
      }

      const result = await res.json();
      toast.success(
        `Presupuesto ${decision === 'APROBADO' ? 'Aprobado' : 'Rechazado'} con comprobante PDF y firma presencial registrada con éxito.`,
        { autoClose: 4000 },
      );

      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Error registrando autorización presencial:', err);
      toast.error(err.message || 'Error al procesar la autorización presencial');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order || !presupuesto) return null;

  const total = Number(presupuesto.total || presupuesto.costoTotal || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-3xl p-0 overflow-hidden"
    >
      {/* Header */}
      <div className={`px-6 py-4 text-white flex justify-between items-center ${
        decision === 'APROBADO' 
          ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
          : 'bg-gradient-to-r from-rose-600 to-red-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <PencilSquareIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              Autorización Presencial de Presupuesto (Taller)
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
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto space-y-5 bg-gray-50/50 dark:bg-gray-900/50">
        
        {/* Selector de Decisión */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Decisión del Cliente sobre el Presupuesto
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('APROBADO')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                decision === 'APROBADO'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <CheckIcon className="w-5 h-5" />
              <span>Aprobar Presupuesto</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('RECHAZADO')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                decision === 'RECHAZADO'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <XMarkIcon className="w-5 h-5" />
              <span>Rechazar Presupuesto</span>
            </button>
          </div>
        </div>

        {/* Resumen Económico */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                Monto Total Presupuestado
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-white font-mono">
                ${total.toFixed(2)} USD
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              Versión {presupuesto.version || 1}
            </span>
          </div>
        </div>

        {/* Datos de la Persona que Autoriza */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-blue-600" />
            Persona que Autoriza en Ventanilla
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <PencilSquareIcon className="w-4 h-4 text-blue-600" />
              Firma Manuscrita del Autorizante (Lienzo Táctil) *
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

          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Firme directamente en la pantalla con el dedo o lápiz óptico dentro del recuadro.
          </p>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white overflow-hidden relative shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-44 cursor-crosshair touch-none block"
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
                Trace su firma aquí
              </div>
            )}
          </div>
        </div>

        {/* Notas u observaciones */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            Observaciones Adicionales (Opcional)
          </label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. Cliente autoriza reemplazo de batería y mantenimiento..."
            className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
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
            <strong>Consentimiento Informado:</strong> En mi calidad de autorizante, declaro que he revisado el detalle de repuestos y servicios del presupuesto técnico versión {presupuesto.version || 1} por un valor total de ${total.toFixed(2)} USD, autorizando a Hospital del Computador a proceder conforme a la decisión indicada. Esta firma manuscrita digitalizada constituye prueba de manifestación expresa de voluntad conforme a la legislación aplicable.
          </span>
        </label>

        {/* Botones de Envío */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
              decision === 'APROBADO'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            } disabled:opacity-50`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando Comprobante y Sellando...</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Registrar y Sellar Documento</span>
              </>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
}
