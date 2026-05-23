'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/interfaces/order';
import { useUsuario } from '@/hooks/useUsuario';
import { useEstadoOrden } from '@/hooks/useEstadoOrden';
import { useCasillero } from '@/hooks/useCasillero';
import { useOrders } from '@/hooks/useOrders';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Role } from '@/types/role';
import { useSession } from 'next-auth/react';
import Label from '../form/Label';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (updatedData: {
    technicianId?: number | null;
    estadoOrdenId?: number | null;
    problemaReportado?: string;
    fechaPrometidaEntrega?: string | null;
    accesorios?: string[];
    casilleroId?: number | null;
    esperaRepuesto?: boolean;
    tiempoEstimadoReparacion?: number;
  }) => Promise<boolean>;
}

export default function OrdenEditModal({ isOpen, onClose, order, onSave }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken || null;
  const { usuarios, loading: loadingUsuarios } = useUsuario({ defaultLimit: 1000, defaultRole: Role.TECH });
  const { estadosOrden, loading: loadingEstados } = useEstadoOrden();
  const { casilleros, fetchAvailableCasilleros, loading: loadingCasilleros } = useCasillero();
  const { getTechniciansAvailability } = useOrders();
  const [techAvailability, setTechAvailability] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    technicianId: '',
    estadoOrdenId: '',
    problemaReportado: '',
    fechaPrometidaEntrega: '',
    accesorios: '',
    casilleroId: '',
    esperaRepuesto: false,
    tiempoEstimadoReparacion: '0'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        technicianId: order.technician?.id?.toString() || '',
        estadoOrdenId: order.estadoOrden?.id?.toString() || '',
        problemaReportado: order.problemaReportado || '',
        fechaPrometidaEntrega: order.fechaPrometidaEntrega
          ? format(new Date(order.fechaPrometidaEntrega), "yyyy-MM-dd'T'HH:mm")
          : '',
        accesorios: order.accesorios?.join(', ') || '',
        casilleroId: order.casillero?.id?.toString() || '',
        esperaRepuesto: order.esperaRepuesto || false,
        tiempoEstimadoReparacion: order.tiempoEstimadoReparacion?.toString() || '0'
      });

      // Cargar casilleros disponibles al abrir el modal
      if (isOpen) {
        fetchAvailableCasilleros();
        getTechniciansAvailability().then(data => {
          setTechAvailability(data || []);
        });
      }
    }
  }, [order, isOpen]);

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {

      const updatedData = {
        estadoOrdenId: formData.estadoOrdenId ? parseInt(formData.estadoOrdenId) : undefined,
        problemaReportado: formData.problemaReportado,
        fechaPrometidaEntrega: formData.fechaPrometidaEntrega ? formData.fechaPrometidaEntrega : null,
        accesorios: formData.accesorios
          ? formData.accesorios.split(',').map(item => item.trim()).filter(item => item)
          : undefined,
        technicianId: formData.technicianId ? parseInt(formData.technicianId) : null,
        casilleroId: formData.casilleroId ? parseInt(formData.casilleroId) : undefined,
        esperaRepuesto: formData.esperaRepuesto,
        tiempoEstimadoReparacion: parseFloat(formData.tiempoEstimadoReparacion) || 0,
      };

      const success = await onSave(updatedData);
      if (success) {
        toast.success("Orden actualizada correctamente");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar orden");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  const tecnicos = React.useMemo(() =>
    usuarios.filter(usuario => usuario.role === Role.TECH && usuario.estado),
    [usuarios]
  );

  const estadosActivos = estadosOrden.filter(estado => estado.estado);

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
      title={`Editar Orden #${order.workOrderNumber}`}
      className="max-w-2xl"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-8">
          Editar Orden #{order.workOrderNumber}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Técnico asignado */}
        {session?.user?.role !== 'tech' && (
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
              Técnico Asignado
            </label>
            <select
              name="technicianId"
              value={formData.technicianId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
              disabled={loadingUsuarios}
            >
              <option value="">Seleccione un técnico</option>
              {tecnicos.map(tecnico => {
                const availability = techAvailability.find(a => a.technicianId === tecnico.id);
                let label = `${tecnico.nombre} ${tecnico.apellido}`;
                if (availability) {
                  const partsStr = availability.waitingForParts > 0 ? ` (${availability.waitingForParts} en espera de repuestos)` : '';
                  label += ` (Órdenes activas: ${availability.workingActive}${partsStr}`;
                  if (availability.nextAvailableDate) {
                    const estDate = new Date(availability.nextAvailableDate);
                    label += `, Disponible aprox: ${estDate.toLocaleDateString()})`;
                  } else {
                    label += `, Disp. inmediata)`;
                  }
                }
                return (
                  <option key={tecnico.id} value={tecnico.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* En espera de repuestos */}
        <div className="flex items-center space-x-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
          <input
            type="checkbox"
            id="esperaRepuesto"
            name="esperaRepuesto"
            checked={formData.esperaRepuesto}
            onChange={(e) => setFormData(prev => ({ ...prev, esperaRepuesto: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="esperaRepuesto" className="font-medium text-amber-800 dark:text-amber-400 text-sm cursor-pointer select-none">
            Marcar ODS en "Espera de Repuestos" (Pausa el conteo del tiempo de espera y libera la agenda del técnico)
          </label>
        </div>

        {/* Tiempo estimado de reparación y Fecha Estimada de Entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tiempo estimado de reparación */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
              Horas Estimadas de Reparación
            </label>
            <input
              type="number"
              name="tiempoEstimadoReparacion"
              value={formData.tiempoEstimadoReparacion}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ej: 2.5"
            />
          </div>

          {/* Fecha prometida de entrega */}
          <div>
            <Label className="mb-2 block">Fecha Estimada de Entrega</Label>
            <div className="relative">
              <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="datetime-local"
                name="fechaPrometidaEntrega"
                value={formData.fechaPrometidaEntrega}
                onChange={(e) => handleChange(e)}
                className="w-full pl-10 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Estado de la orden (Eliminado para respetar el flujo estricto) */}        {/* Casillero - Siempre visible */}
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Asignar Casillero
          </label>
          <select
            name="casilleroId"
            value={formData.casilleroId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={loadingCasilleros}
          >
            <option value="">Seleccione un casillero</option>
            {casillerosDisponibles.map(casillero => (
              <option
                key={casillero.id}
                value={casillero.id}
                disabled={casillero.situacion === 'Ocupado' && casillero.order?.id !== order.id}
              >
                {casillero.codigo} - {casillero.descripcion}
                {casillero.situacion === 'Ocupado' && casillero.order?.id === order.id && ' (Asignado)'}
                {casillero.situacion === 'Ocupado' && casillero.order?.id !== order.id && ' (Ocupado)'}
              </option>
            ))}
          </select>
        </div>

        {/* Problema reportado */}
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Problema Reportado
          </label>
          <textarea
            name="problemaReportado"
            value={formData.problemaReportado}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]"
            required
          />
        </div>


        {/* Accesorios */}
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Accesorios (separados por comas)
          </label>
          <input
            type="text"
            name="accesorios"
            value={formData.accesorios}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ejemplo: Cargador, Funda, Cable HDMI"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
