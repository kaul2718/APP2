'use client';

import React from 'react';
import AgregarPresupuestoModal from './AgregarPresupuestoModal';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess: () => void;
}

export default function AddBudgetModal({ isOpen, onClose, orderId, onSuccess }: AddBudgetModalProps) {
  return (
    <AgregarPresupuestoModal
      isOpen={isOpen}
      onClose={onClose}
      orderId={orderId}
      onSuccess={(id) => {
        void id;
        onSuccess();
      }}
    />
  );
}