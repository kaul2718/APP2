"use client";

import { Modal } from "@/components/ui/modal";
import IngresarEstadoPresupuestoForm from "@/components/form/ingresar-estado-presupuesto/IngresarEstadoPresupuestoForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AgregarEstadoPresupuestoModal({ isOpen, onClose, onSuccess }: Props) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar estado de presupuesto"
      className="max-w-3xl mx-4"
    >
      <div className="px-6 pt-4 pb-6">
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-800 dark:text-white">
          Agregar Estado de Presupuesto
        </h2>
        <div className="custom-scrollbar max-h-[75vh] overflow-y-auto pr-1">
          <IngresarEstadoPresupuestoForm embeddedMode onSuccess={handleSuccess} onClose={onClose} />
        </div>
      </div>
    </Modal>
  );
}
