"use client";
 
import { Modal } from "@/components/ui/modal";
import IngresarParteForm from "@/components/form/ingresar-parte/IngresarParteForm";
 
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
 
export default function AgregarAlmacenModal({ isOpen, onClose, onSuccess }: Props) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };
 
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Producto en Almacén"
      className="max-w-4xl mx-4"
    >
      <div className="px-6 pt-2 pb-6">
        <div className="custom-scrollbar max-h-[85vh] overflow-y-auto pr-1">
          <IngresarParteForm embeddedMode onSuccess={handleSuccess} />
        </div>
      </div>
    </Modal>
  );
}
