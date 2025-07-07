'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { useOrders } from '@/hooks/useOrders';
import { useTipoActividades } from '@/hooks/useTipoActividades';

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
  textarea = false,
  rows = 3,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
}) => (
  <div>
    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        required={required}
        rows={rows}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        required={required}
      />
    )}
  </div>
);

export default function AddActivityModal({ isOpen, onClose, orderId, onSuccess }: Props) {
  const { data: session } = useSession();
  const { addActivity } = useOrders();
  const { tiposActividades, loading: loadingTipos } = useTipoActividades();

  const [formData, setFormData] = useState({
    tipoActividadId: '',
    diagnostico: '',
    trabajoRealizado: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addActivity(orderId, {
        tipoActividadId: Number(formData.tipoActividadId),
        diagnostico: formData.diagnostico,
        trabajoRealizado: formData.trabajoRealizado,
      });

      toast.success('Actividad técnica agregada correctamente');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error al agregar actividad:', error);
      toast.error('Error al agregar actividad técnica');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipoActividadId: '',
      diagnostico: '',
      trabajoRealizado: '',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Actividad Técnica"
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

        {/* Formulario de Actividad */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Detalles de la Actividad
          </h3>
          <div className="grid grid-cols-1 gap-y-4">
            {/* Tipo de Actividad */}
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
                Tipo de Actividad
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.tipoActividadId}
                onChange={(e) => setFormData({...formData, tipoActividadId: e.target.value})}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                required
                disabled={loadingTipos}
              >
                <option value="">Seleccione un tipo</option>
                {tiposActividades.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {loadingTipos && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Cargando tipos de actividad...
                </p>
              )}
            </div>

            {/* Diagnóstico */}
            <InputField
              label="Diagnóstico"
              value={formData.diagnostico}
              onChange={(value) => setFormData({...formData, diagnostico: value})}
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </Icon>
              }
              textarea
              required
            />

            {/* Trabajo Realizado */}
            <InputField
              label="Trabajo Realizado"
              value={formData.trabajoRealizado}
              onChange={(value) => setFormData({...formData, trabajoRealizado: value})}
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </Icon>
              }
              textarea
              required
            />
          </div>
        </section>

        {/* Botones */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={loading || !formData.tipoActividadId}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar Actividad'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}