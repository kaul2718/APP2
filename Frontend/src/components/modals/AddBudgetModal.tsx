'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { useOrders } from '@/hooks/useOrders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess: () => void;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-5 h-5 mr-2 text-gray-400 dark:text-gray-500">
    {children}
  </span>
);

const InputField = ({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  required = false,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
}) => (
  <div>
    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      required={required}
    />
  </div>
);

export default function AddBudgetModal({ isOpen, onClose, orderId, onSuccess }: Props) {
  const { data: session } = useSession();
  const { addPresupuesto } = useOrders();

  const [formData, setFormData] = useState({
    descripcion: '',
    estadoId: 1, // Estado por defecto (ej. "Pendiente")
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addPresupuesto(orderId, {
        descripcion: formData.descripcion,
        estadoId: formData.estadoId,
      });

      toast.success('Presupuesto agregado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al agregar presupuesto:', error);
      toast.error('Error al agregar presupuesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Presupuesto"
      className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6 text-sm">
        {/* Información de la Orden */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Información de la Orden
          </h3>
          <div className="grid grid-cols-1 gap-y-4 p-4 bg-gray-50 rounded-md dark:bg-gray-800">
            <div className="flex items-center">
              <Icon>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </Icon>
              <span className="font-medium">Orden ID:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-300">{orderId}</span>
            </div>
          </div>
        </section>

        {/* Formulario de Presupuesto */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Detalles del Presupuesto
          </h3>
          <div className="grid grid-cols-1 gap-y-4">
            <InputField
              label="Descripción"
              value={formData.descripcion}
              onChange={(value) => setFormData({...formData, descripcion: value})}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Icon>
              }
              required
            />

            <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </Icon>
                Estado del Presupuesto
              </label>
              <select
                value={formData.estadoId}
                onChange={(e) => setFormData({...formData, estadoId: Number(e.target.value)})}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              >
                <option value={1}>Pendiente</option>
                <option value={2}>Aprobado</option>
                <option value={3}>Rechazado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Nota sobre repuestos */}
        <div className="p-4 bg-blue-50 rounded-md dark:bg-blue-900/30">
          <div className="flex items-start">
            <Icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-blue-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Icon>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Los repuestos y mano de obra se agregarán después de crear el presupuesto.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              'Guardar Presupuesto'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}