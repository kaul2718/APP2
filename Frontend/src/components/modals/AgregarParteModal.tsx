"use client";

import { Modal } from "@/components/ui/modal";
import IngresarParteForm from "@/components/form/ingresar-parte/IngresarParteForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AgregarParteModal({ isOpen, onClose, onSuccess }: Props) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar ítem al catálogo"
      className="max-w-4xl mx-4"
    >
      <div className="px-6 pt-4 pb-6">
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-800 dark:text-white">
          Agregar Ítem al Catálogo
        </h2>
        <div className="custom-scrollbar max-h-[75vh] overflow-y-auto pr-1">
          <IngresarParteForm embeddedMode onSuccess={handleSuccess} />
        </div>
      </div>
    </Modal>
  );
}
