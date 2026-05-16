'use client';

import React from "react";
import { Modal } from "@/components/ui/modal";
import IngresarChecklistTemplateForm from "../form/ingresar-checklist-template/IngresarChecklistTemplateForm";
import { ChecklistTemplate } from "@/types/checklist.types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    template: ChecklistTemplate | null;
}

export default function EditarChecklistTemplateModal({ isOpen, onClose, onSuccess, template }: Props) {
    if (!template) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Editar Plantilla: ${template.nombre}`}
            className="max-w-2xl"
        >
            <div className="p-4 sm:p-6">
                <IngresarChecklistTemplateForm 
                    template={template}
                    onSuccess={() => {
                        if (onSuccess) onSuccess();
                        onClose();
                    }} 
                />
            </div>
        </Modal>
    );
}
