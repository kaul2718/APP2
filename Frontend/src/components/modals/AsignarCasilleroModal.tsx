'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/interfaces/order';
import { useCasillero } from '@/hooks/useCasillero';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (updatedData: { casilleroId?: number | null }) => Promise<boolean>;
}

export default function AsignarCasilleroModal({ isOpen, onClose, order, onSave }: Props) {
  const { casilleros, fetchAvailableCasilleros, loading: loadingCasilleros } = useCasillero();
  const [casilleroId, setCasilleroId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setCasilleroId(order.casillero?.id?.toString() || '');
      if (isOpen) {
        fetchAvailableCasilleros();
      }
    }
  }, [order, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedData = {
        casilleroId: casilleroId ? parseInt(casilleroId) : null,
      };

      const success = await onSave(updatedData);
      if (success) {
        toast.success("Casillero asignado correctamente");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al asignar casillero");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  // Filtrar casilleros disponibles o asignados a esta orden
  const casillerosDisponibles = React.useMemo(() =>
    casilleros.filter(c =>
      c.situacion === 'Disponible' ||
      (c.order && c.order.id === order.id)
    ),
    [casilleros, order]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar Casillero - Orden #${order.workOrderNumber}`}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Resumen del equipo y cliente */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Seleccione el Casillero / Ubicación de Almacenamiento
          </label>
          <select
            value={casilleroId}
            onChange={(e) => setCasilleroId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
            disabled={loadingCasilleros}
          >
            <option value="">Sin casillero asignado</option>
            {casillerosDisponibles.map(casillero => (
              <option
                key={casillero.id}
                value={casillero.id}
                disabled={casillero.situacion === 'Ocupado' && casillero.order?.id !== order.id}
              >
                {casillero.codigo} - {casillero.descripcion}
                {casillero.situacion === 'Ocupado' && casillero.order?.id === order.id && ' (Actual)'}
                {casillero.situacion === 'Ocupado' && casillero.order?.id !== order.id && ' (Ocupado)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 pl-0.5">
            Los casilleros ocupados por otras órdenes no están disponibles para selección.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500 transition-colors shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Asignar Casillero'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
