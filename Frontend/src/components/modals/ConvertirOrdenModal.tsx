'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/types/order.types';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { apiRequest } from '@/lib/api';
import { useChecklistTemplate } from '@/hooks/useChecklistTemplate';
import InspeccionRecepcionForm from '@/components/form/ingresar-orden/InspeccionRecepcionForm';
import { InspeccionRecepcionData } from '@/types/checklist.types';
import {
  ArrowUpCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

export default function ConvertirOrdenModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: Props) {
  const { data: session } = useSession();
  const { getTemplateByTipoEquipo, selectedTemplate, loadingTemplate } = useChecklistTemplate();

  const [motivoEscalamiento, setMotivoEscalamiento] = useState('');
  const [autorizadoCliente, setAutorizadoCliente] = useState(false);
  const [medioAutorizacion, setMedioAutorizacion] = useState<'Llamada telefónica' | 'WhatsApp' | 'Presencial en mostrador' | 'Correo electrónico'>('Llamada telefónica');
  const [detallesAutorizacion, setDetallesAutorizacion] = useState('');
  const [inspeccionData, setInspeccionData] = useState<InspeccionRecepcionData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInspeccionChange = useCallback((data: InspeccionRecepcionData) => {
    setInspeccionData(prev => {
      if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
      return data;
    });
  }, []);

  // Cargar plantilla del equipo si existe
  useEffect(() => {
    if (order?.equipo?.tipoEquipo?.id) {
      void getTemplateByTipoEquipo(order.equipo.tipoEquipo.id);
    }
  }, [order?.equipo?.tipoEquipo?.id, getTemplateByTipoEquipo]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!motivoEscalamiento.trim()) {
      toast.error('Debe ingresar el motivo técnico del escalamiento');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        motivoEscalamiento: motivoEscalamiento.trim(),
        autorizacionCliente: {
          autorizado: autorizadoCliente,
          medio: autorizadoCliente ? medioAutorizacion : undefined,
          fechaAutorizacion: autorizadoCliente ? new Date().toISOString() : undefined,
          detalles: detallesAutorizacion.trim() || undefined,
        },
        inspeccionComplementaria: {
          estadoEncendido: inspeccionData?.estadoEncendido || 'no_probado',
          fisica: inspeccionData?.fisica || [],
          funcional: inspeccionData?.funcional || [],
          observacionesTecnicas: inspeccionData?.observacionGeneral || '',
        },
      };

      await apiRequest(
        `/orders/${order.id}/convertir-completa`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
        session
      );

      toast.success(`Orden #${order.workOrderNumber} escalada exitosamente a Orden Completa`, {
        position: 'top-center',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al convertir orden:', err);
      toast.error(err.message || 'Error al escalar orden a Completa');
    } finally {
      setSubmitting(false);
    }
  };

  const tipoEquipoNombre = order.equipo?.tipoEquipo?.nombre || 'General';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Escalamiento a Orden Completa: #${order.workOrderNumber}`}
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        {/* Banner Informativo */}
        <div className="rounded-xl p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white flex-shrink-0">
            <ArrowUpCircleIcon className="w-5 h-5" />
          </div>
          <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
            <p className="font-bold text-sm">Transición de Orden Express a Orden Completa</p>
            <p>
              Esta acción habilita el diagnóstico técnico profundo, presupuesto detallado y repuestos.
              La constancia de recepción original se conservará intacta en el historial de la orden.
            </p>
          </div>
        </div>

        {/* 1. Motivo del Escalamiento (Obligatorio) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
            1. Motivo Técnico del Escalamiento *
          </label>
          <textarea
            required
            value={motivoEscalamiento}
            onChange={e => setMotivoEscalamiento(e.target.value)}
            rows={3}
            placeholder="Describa la falla compleja detectada durante la revisión preliminar (ej. Se detectó cortocircuito en placa madre, sobrecalentamiento crítico de GPU o bisagra rota no visible inicialmente)..."
            className="w-full p-3 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* 2. Consentimiento / Autorización del Cliente */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autorizadoCliente}
              onChange={e => setAutorizadoCliente(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
            />
            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
              ¿El cliente fue informado y autorizó el cambio de alcance / costo de diagnóstico?
            </span>
          </label>

          {autorizadoCliente && (
            <div className="pl-6 pt-2 space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Medio de Autorización:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Llamada telefónica',
                    'WhatsApp',
                    'Presencial en mostrador',
                    'Correo electrónico',
                  ].map(medio => (
                    <button
                      key={medio}
                      type="button"
                      onClick={() => setMedioAutorizacion(medio as any)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        medioAutorizacion === medio
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {medio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={detallesAutorizacion}
                  onChange={e => setDetallesAutorizacion(e.target.value)}
                  placeholder="Detalles adicionales (ej. Acepta diagnóstico técnico y apertura de chasis)..."
                  className="w-full p-2.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Inspección Inicial Complementaria (Taller) */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              3. Inspección Inicial Complementaria ({tipoEquipoNombre})
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Registre las condiciones físicas y funcionales detectadas en taller antes del desmontaje.
            </p>
          </div>

          {loadingTemplate ? (
            <div className="p-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent animate-spin rounded-full"></div>
              Cargando plantilla técnica...
            </div>
          ) : (
            <InspeccionRecepcionForm
              template={selectedTemplate}
              tipoEquipoNombre={tipoEquipoNombre}
              onChange={handleInspeccionChange}
            />
          )}
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                Escalando orden...
              </>
            ) : (
              <>
                <ArrowUpCircleIcon className="w-4 h-4" />
                Confirmar Escalamiento a Orden Completa
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
