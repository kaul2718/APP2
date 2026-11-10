'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import {
  CheckCircleIcon,
  QrCodeIcon,
  ClipboardDocumentCheckIcon,
  PrinterIcon,
  ArrowRightIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  TicketIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    workOrderNumber: string;
    client?: any;
    cuentaPendiente?: boolean;
    tokenActivacion?: string | null;
    activacion?: {
      token: string;
      qrUrl: string;
      qrDataUrl: string;
      expiresAt: string;
    } | null;
    [key: string]: any;
  } | null;
  onOpenPdfModal?: () => void;
  onOpenTicketModal?: () => void;
  onFinalize: () => void;
}

export default function OrdenCreadaModal({
  isOpen,
  onClose,
  order,
  onOpenPdfModal,
  onOpenTicketModal,
  onFinalize,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const clienteNombre = order.client
    ? `${order.client.nombre || ''} ${order.client.apellido || ''}`.trim()
    : 'Estimado Cliente';
  const clienteCedula = order.client?.cedula || '';
  const isPending = Boolean(order.cuentaPendiente && order.activacion?.qrUrl);

  const handleCopyLink = async () => {
    if (!order.activacion?.qrUrl) return;

    const mensaje = `Hola ${clienteNombre}, tu equipo ha ingresado a servicio técnico en Hospital del Computador bajo la Orden #${order.workOrderNumber}. Por favor activa tu acceso y define tu contraseña personal desde este enlace seguro: ${order.activacion.qrUrl}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(mensaje);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = mensaje;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('¡Mensaje copiado para enviar por WhatsApp o SMS!', {
        position: 'top-center',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('No se pudo copiar automáticamente.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 sm:p-8">
      <div className="text-center space-y-4">
        {/* Header Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircleIcon className="h-9 w-9" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Recepción Completada
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            Orden #{order.workOrderNumber}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Cliente: <strong className="text-gray-800 dark:text-gray-200">{clienteNombre}</strong> {clienteCedula && `(C.I. ${clienteCedula})`}
          </p>
        </div>

        {/* Conditional Box: Pending Activation vs Active Account */}
        {isPending ? (
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5 text-left dark:border-brand-900/50 dark:bg-brand-950/20 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-900/40 pb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-black uppercase tracking-wider text-brand-900 dark:text-brand-200">
                  Activación de Cuenta de Cliente
                </span>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Pendiente (48 horas)
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              El cliente aún no ha establecido su contraseña personal. Puede escanear el código QR directamente desde el mostrador o recibir su enlace por WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-900/80 p-3.5 rounded-xl border border-brand-100 dark:border-brand-900/40">
              {order.activacion?.qrDataUrl && (
                <div className="flex-shrink-0 bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
                  <img
                    src={order.activacion.qrDataUrl}
                    alt="Código QR de Activación"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Enlace de un solo uso
                </p>
                <p className="text-[11px] text-gray-500 font-mono break-all line-clamp-2">
                  {order.activacion?.qrUrl}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors shadow-xs"
                >
                  <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                  {copied ? '¡Copiado!' : 'Copiar mensaje WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-left dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-start gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                Cliente con Cuenta Activa
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                Este cliente ya tiene credenciales de acceso. Puede iniciar sesión con su cédula ({clienteCedula || 'su identificación'}) en el portal web para ver todas sus órdenes y autorizar presupuestos.
              </p>
            </div>
          </div>
        )}

        {/* Selector de Comprobante de Recepción */}
        <div className="pt-2 text-left space-y-2">
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
            Comprobante de Recepción
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {onOpenTicketModal && (
              <button
                type="button"
                onClick={onOpenTicketModal}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
              >
                <TicketIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Imprimir Ticket (80 mm)</span>
              </button>
            )}

            {onOpenPdfModal && (
              <button
                type="button"
                onClick={onOpenPdfModal}
                className="flex items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50/80 p-3 text-xs font-bold text-brand-800 hover:bg-brand-100 transition-colors dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 shadow-xs"
              >
                <DocumentTextIcon className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>Generar ODS Completa (A4)</span>
              </button>
            )}
          </div>
        </div>

        {/* Botón de Finalizar */}
        <div className="pt-2">
          <Button
            type="button"
            className="w-full justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold dark:bg-gray-800 dark:hover:bg-gray-700 shadow-xs"
            onClick={onFinalize}
          >
            <span>Ir a Lista de Órdenes</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

