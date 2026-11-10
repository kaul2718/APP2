'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/types/order.types';
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
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  tipoDocumento: 'RECEPCION' | 'ENTREGA';
  onSignedSuccess: (doc: any) => void;
}

export default function TabletSignatureModal({
  isOpen,
  onClose,
  order,
  tipoDocumento,
  onSignedSuccess,
}: Props) {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isRecepcion = tipoDocumento === 'RECEPCION';

  // Datos del firmante
  const [firmanteNombre, setFirmanteNombre] = useState('');
  const [firmanteIdentificacion, setFirmanteIdentificacion] = useState('');
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [clienteRechazaFirma, setClienteRechazaFirma] = useState(false);
  const [motivoSinFirma, setMotivoSinFirma] = useState('');

  // Estado del dibujo
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);
  const pointsCountRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);

  // Inicializar datos del cliente
  useEffect(() => {
    if (order) {
      const client = order.client as any;
      const nombreCompleto = client
        ? `${client.nombre || ''} ${client.apellido || ''}`.trim()
        : '';
      setFirmanteNombre(nombreCompleto);
      setFirmanteIdentificacion(client?.cedula || '');
      setTerminosAceptados(true);
      setClienteRechazaFirma(false);
      setMotivoSinFirma('');
      setPointsCount(0);
      pointsCountRef.current = 0;
    }
  }, [order, isOpen]);

  // Inicializar Canvas con Retina / DPI scaling 1:1 exacto sin desfase de coordenadas
  useEffect(() => {
    if (!isOpen || clienteRechazaFirma) return;

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
        // ctx.scale(dpr, dpr) permite dibujar directamente en coordenadas CSS (1:1)
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0f2b61'; // Azul tinta corporativo indeleble
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
    const timer = setTimeout(setupCanvas, 100);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [isOpen, clienteRechazaFirma]);

  // Manejadores de dibujo táctil / Pointer Events con mapeo 1:1 exacto y corrección dinámica
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    // Factor de escala dinámico: protege contra cualquier redimensión por barras de scroll
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    pointsCountRef.current++;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    pointsCountRef.current++;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setPointsCount(pointsCountRef.current);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    pointsCountRef.current = 0;
    setPointsCount(0);
  };

  // Enviar firma y generar documento
  const handleSubmit = async () => {
    if (!order) return;

    if (!firmanteNombre.trim() || !firmanteIdentificacion.trim()) {
      toast.error('Ingrese el nombre y cédula/RUC del firmante.');
      return;
    }

    if (!terminosAceptados) {
      toast.error('Debe aceptar los términos y condiciones para proceder.');
      return;
    }

    let firmaBase64: string | undefined = undefined;

    if (!clienteRechazaFirma) {
      if (pointsCount < 15) {
        toast.warning(
          'La firma dibujada es muy corta o está vacía. Por favor trace su firma en el recuadro.',
        );
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      firmaBase64 = canvas.toDataURL('image/png');
    } else {
      if (!motivoSinFirma.trim()) {
        toast.error('Especifique el motivo por el cual no se registra la firma.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        tipoDocumento,
        firmaBase64,
        firmanteNombre: firmanteNombre.trim(),
        firmanteIdentificacion: firmanteIdentificacion.trim(),
        versionTerminos: 'v1.0-2026',
        terminosAceptados: true,
        estadoFirma: clienteRechazaFirma ? 'RECHAZADO_CLIENTE' : 'FIRMADO',
        motivoSinFirma: clienteRechazaFirma ? motivoSinFirma.trim() : undefined,
        tokenAccesoRaw: (order as any)?.tokenAccesoRaw,
        tokenActivacion: (order as any)?.tokenActivacion || (order as any)?.activacion?.token,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/documentos/firmar`,
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
        let msg = 'Error al sellar el documento firmado.';
        try {
          const errorData = await res.json();
          if (Array.isArray(errorData?.message)) {
            msg = errorData.message.join(', ');
          } else if (errorData?.message) {
            msg = errorData.message;
          }
        } catch {}
        throw new Error(msg);
      }

      const docCreado = await res.json();
      toast.success(
        `Acta de ${isRecepcion ? 'Ingreso' : 'Entrega'} firmada y sellada con éxito en Cloudflare R2`,
        { autoClose: 3500 },
      );

      onSignedSuccess(docCreado);
      onClose();
    } catch (err: any) {
      console.error('Error registrando firma:', err);
      toast.error(err.message || 'Error al procesar la firma en tablet.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-4xl p-0 overflow-hidden"
    >
      {/* Encabezado especial con estética táctil */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <PencilSquareIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isRecepcion ? 'Firma de Recepción e Ingreso' : 'Firma de Entrega y Garantía'}
            </h2>
            <p className="text-xs text-blue-200">
              Orden de Servicio #{order.workOrderNumber} — Dispositivo Táctil
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

      <div className="p-6 max-h-[calc(90vh-9rem)] overflow-y-auto space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
        
        {/* Resumen de la Orden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta Cliente */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <DocumentTextIcon className="w-4 h-4 text-blue-600" />
              Datos del Firmante
            </h3>
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={firmanteNombre}
                  onChange={(e) => setFirmanteNombre(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Cédula / RUC:
                </label>
                <input
                  type="text"
                  value={firmanteIdentificacion}
                  onChange={(e) => setFirmanteIdentificacion(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta Equipo y Estado */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
              Información del Equipo
            </h3>
            <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1 pt-1">
              <p>
                <span className="font-bold">Equipo:</span> {order.equipo?.tipoEquipo?.nombre || 'General'}
              </p>
              <p>
                <span className="font-bold">Marca / Modelo:</span>{' '}
                {order.equipo?.marca?.nombre} {order.equipo?.modelo?.nombre}
              </p>
              <p>
                <span className="font-bold">Serie:</span> {order.equipo?.numeroSerie || 'S/N'}
              </p>
              {isRecepcion ? (
                <p className="line-clamp-2 italic text-gray-600 dark:text-gray-400">
                  <span className="font-bold not-italic">Falla reportada:</span> "{order.problemaReportado}"
                </p>
              ) : (
                <p className="text-blue-600 dark:text-blue-400 font-bold">
                  Estado: Listo para Entrega / Conformidad
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Términos y Condiciones Legales */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              {isRecepcion ? 'Términos de Recepción y Custodia' : 'Conformidad de Entrega y Garantía Técnica'}
            </h3>
            <span className="text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
              Versión v1.0
            </span>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-300 max-h-28 overflow-y-auto pr-2 space-y-1.5 border-l-2 border-blue-500 pl-3 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-r-lg leading-relaxed">
            {isRecepcion ? (
              <>
                <p>
                  <strong>1. Respaldo de Información:</strong> Hospital del Computador no se responsabiliza por la pérdida de datos en discos duros, memorias o unidades de almacenamiento. El cliente declara contar con respaldos previos.
                </p>
                <p>
                  <strong>2. Cláusula de Abandono (Art. 60 días):</strong> Equipos no retirados tras 60 días de notificación de disponibilidad se considerarán abandonados legalmente para cubrir costos de diagnóstico y repuestos.
                </p>
                <p>
                  <strong>3. Diagnóstico Presuntivo:</strong> La revisión visual de ingreso es preliminar y sujeta a confirmación en laboratorio.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>1. Conformidad de Recepción:</strong> Declaro haber probado y recibido el equipo reparado a mi entera satisfacción y conformidad.
                </p>
                <p>
                  <strong>2. Garantía Limitada:</strong> Todo trabajo cuenta con garantía sobre mano de obra y repuestos sustituidos. No aplica si el equipo presenta sellos violados, daños por humedad, golpes o intervención ajena.
                </p>
              </>
            )}
          </div>

          {/* Consentimiento obligatorio */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={terminosAceptados}
              onChange={(e) => setTerminosAceptados(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              He leído, comprendo y acepto las condiciones descritas y autorizo el tratamiento de mis datos personales conforme a la LOPDP de Ecuador para fines del servicio.
            </span>
          </label>
        </div>

        {/* Excepción controlada: Cliente no puede firmar */}
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={clienteRechazaFirma}
              onChange={(e) => setClienteRechazaFirma(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span>Cliente no puede / se niega a firmar (Retiro por tercero o mensajería)</span>
          </label>
        </div>

        {clienteRechazaFirma ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Justificación de Excepción de Firma
            </div>
            <textarea
              rows={2}
              value={motivoSinFirma}
              onChange={(e) => setMotivoSinFirma(e.target.value)}
              placeholder="Indique el motivo detallado (ej: Retirado por mensajero de encomiendas, cliente se niega a estampar trazo...)"
              className="w-full text-xs p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        ) : (
          /* Canvas de Firma Táctil */
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                  Área de Captura de Firma Manuscrita
                </h3>
                <p className="text-[11px] text-gray-500">
                  Trace su firma con el dedo o lápiz táctil dentro del recuadro
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                Limpiar trazo
              </button>
            </div>

            <div className="relative w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white overflow-hidden touch-none shadow-sm">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-60 block cursor-crosshair touch-none select-none relative z-10"
              />
              {/* Línea guía de firma tipo pad digital */}
              <div className="absolute inset-x-8 bottom-10 border-b border-gray-300 pointer-events-none flex justify-between text-[11px] text-gray-400 select-none z-0">
                <span className="font-mono">✕ _____________________________________</span>
                <span>Firme sobre la línea</span>
              </div>
              {pointsCount === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs italic z-0">
                  Trace su firma aquí...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Sensibilidad táctil: Alta (DPI Retina)</span>
              <span>
                {pointsCount >= 15 ? (
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    <CheckIcon className="w-3.5 h-3.5" /> Trazo detectado
                  </span>
                ) : (
                  <span className="text-gray-400">Trazo pendiente</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end items-center gap-3 px-6 py-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !terminosAceptados || (!clienteRechazaFirma && pointsCount < 15)}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all ${
            submitting || !terminosAceptados || (!clienteRechazaFirma && pointsCount < 15)
              ? 'bg-gray-400 cursor-not-allowed opacity-70'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sellando en Cloudflare R2...
            </>
          ) : (
            <>
              <CheckIcon className="w-4 h-4" />
              Confirmar y Registrar Firma
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
