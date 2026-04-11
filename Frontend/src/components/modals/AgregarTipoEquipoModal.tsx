"use client";

import { Modal } from "@/components/ui/modal";
import IngresarTipoEquipoForm from "@/components/form/ingresar-tipo-equipo/IngresarTipoEquipoForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AgregarTipoEquipoModal({ isOpen, onClose, onSuccess }: Props) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar tipo de equipo"
      className="max-w-3xl mx-4"
    >
      <div className="px-6 pt-4 pb-6">
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-800 dark:text-white">
          Agregar Tipo de Equipo
        </h2>
        <div className="custom-scrollbar max-h-[75vh] overflow-y-auto pr-1">
          <IngresarTipoEquipoForm onSuccess={handleSuccess} onClose={onClose} />
        </div>
      </div>
    </Modal>
  );
}
