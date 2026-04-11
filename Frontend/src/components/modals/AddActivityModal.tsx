'use client';

import React from 'react';
import AgregarActividadTecnicaModal from './AgregarActividadTecnicaModal';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess: () => void;
}

export default function AddActivityModal({ isOpen, onClose, orderId, onSuccess }: AddActivityModalProps) {
  return (
    <AgregarActividadTecnicaModal
      isOpen={isOpen}
      onClose={onClose}
      orderId={orderId}
      onSuccess={() => onSuccess()}
    />
  );
}