'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/interfaces/order';
import { useUsuario } from '@/hooks/useUsuario';
import { useEstadoOrden } from '@/hooks/useEstadoOrden';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Role } from '@/types/role';

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
  }) => Promise<boolean>;
}

export default function OrdenEditModal({ isOpen, onClose, order, onSave }: Props) {
  const { usuarios, loading: loadingUsuarios } = useUsuario();
  const { estadosOrden, loading: loadingEstados } = useEstadoOrden();

  const [formData, setFormData] = useState({
    technicianId: '',
    estadoOrdenId: '',
    problemaReportado: '',
    fechaPrometidaEntrega: '',
    accesorios: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        technicianId: order.technician?.id?.toString() || '',
        estadoOrdenId: order.estadoOrden?.id?.toString() || '',
        problemaReportado: order.problemaReportado || '',
        fechaPrometidaEntrega: order.fechaPrometidaEntrega
          ? format(new Date(order.fechaPrometidaEntrega), 'yyyy-MM-dd')
          : '',
        accesorios: order.accesorios?.join(', ') || ''
      });
    }
  }, [order]);

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
        fechaPrometidaEntrega: formData.fechaPrometidaEntrega || undefined,
        accesorios: formData.accesorios
          ? formData.accesorios.split(',').map(item => item.trim()).filter(item => item)
          : undefined,
        technicianId: formData.technicianId ? parseInt(formData.technicianId) : undefined
      };

      await onSave(updatedData);
      toast.success("Orden actualizada correctamente");
      onClose();
    } catch (error) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Orden #${order.workOrderNumber}`}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Técnico asignado */}
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Técnico Asignado
          </label>
          <select
            name="technicianId"
            value={formData.technicianId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={loadingUsuarios}
          >
            <option value="">Seleccione un técnico</option>
            {tecnicos.map(tecnico => (
              <option key={tecnico.id} value={tecnico.id}>
                {tecnico.nombre} {tecnico.apellido}
              </option>
            ))}
          </select>
        </div>

        {/* Estado de la orden */}
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Estado de la Orden
          </label>
          <select
            name="estadoOrdenId"
            value={formData.estadoOrdenId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={loadingEstados}
          >
            <option value="">Seleccione un estado</option>
            {estadosActivos.map(estado => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
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

        {/* Fecha prometida de entrega */}
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Fecha Prometida de Entrega
          </label>
          <input
            type="date"
            name="fechaPrometidaEntrega"
            value={formData.fechaPrometidaEntrega}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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