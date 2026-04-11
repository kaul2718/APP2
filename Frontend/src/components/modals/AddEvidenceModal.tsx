'use client';

import React from 'react';
import AgregarEvidenciaTecnicaModal from './AgregarEvidenciaTecnicaModal';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess: () => void;
}

export default function AddEvidenceModal({ isOpen, onClose, orderId, onSuccess }: AddEvidenceModalProps) {
  return (
    <AgregarEvidenciaTecnicaModal
      isOpen={isOpen}
      onClose={onClose}
      orderId={orderId}
      onSuccess={onSuccess}
    />
  );
}