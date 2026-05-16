'use client';

import React from "react";
import { Modal } from "@/components/ui/modal";
import IngresarChecklistTemplateForm from "../form/ingresar-checklist-template/IngresarChecklistTemplateForm";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AgregarChecklistTemplateModal({ isOpen, onClose, onSuccess }: Props) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Agregar Plantilla de Checklist"
            className="max-w-2xl"
        >
            <div className="p-4 sm:p-6">
                <IngresarChecklistTemplateForm 
                    onSuccess={() => {
                        if (onSuccess) onSuccess();
                        onClose();
                    }} 
                />
            </div>
        </Modal>
    );
}
