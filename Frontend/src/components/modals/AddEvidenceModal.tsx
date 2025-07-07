'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
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

export default function AddEvidenceModal({ isOpen, onClose, orderId, onSuccess }: Props) {
  const { data: session } = useSession();
  const { addEvidenciaTecnica } = useOrders();

  const [formData, setFormData] = useState({
    descripcion: '',
    imagen: null as File | null,
    previewUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tipo de archivo
      if (!file.type.match('image.*')) {
        toast.error('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (ej. 5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe exceder los 5MB');
        return;
      }

      setFormData({
        ...formData,
        imagen: file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.imagen) {
      toast.error('Debes seleccionar una imagen');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('ordenId', orderId.toString());
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('imagen', formData.imagen);

      await addEvidenciaTecnica(orderId, formDataToSend);

      toast.success('Evidencia agregada correctamente');
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error al agregar evidencia:', error);
      toast.error('Error al agregar evidencia');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descripcion: '',
      imagen: null,
      previewUrl: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Evidencia Técnica"
      className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
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

        {/* Formulario de Evidencia */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Detalles de la Evidencia
          </h3>
          <div className="grid grid-cols-1 gap-y-4">
            {/* Campo de descripción */}
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Icon>
                Descripción (Opcional)
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                rows={3}
              />
            </div>

            {/* Selector de imagen */}
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </Icon>
                Imagen de Evidencia
                <span className="text-red-500 ml-1">*</span>
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                required
              />
              
              <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                {formData.previewUrl ? (
                  <>
                    <div className="mb-4 relative">
                      <img
                        src={formData.previewUrl}
                        alt="Vista previa"
                        className="max-h-48 max-w-full rounded-md object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, imagen: null, previewUrl: ''})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formData.imagen?.name}
                    </p>
                  </>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="mt-2 flex text-sm text-gray-600 dark:text-gray-300">
                      <label
                        onClick={triggerFileInput}
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none dark:bg-gray-800"
                      >
                        <span>Sube una imagen</span>
                      </label>
                      <p className="pl-1">o arrástrala aquí</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
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
            disabled={loading || !formData.imagen}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </span>
            ) : (
              'Guardar Evidencia'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}