'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryItem } from '@/data/landingData';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  items: GalleryItem[];
}

export default function LightboxModal({
  isOpen,
  onClose,
  currentIndex,
  onNext,
  onPrev,
  items,
}: LightboxProps) {
  const currentItem = items[currentIndex];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [isOpen, onClose, onNext, onPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown, isOpen]);

  if (!isOpen || !currentItem) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md">
        
        {/* Barra Superior de Control */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-gray-950 uppercase tracking-wider">
              {currentItem.categoryLabel}
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-300">
              {currentIndex + 1} de {items.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors focus:outline-none"
            aria-label="Cerrar visor"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Botón Anterior */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110 focus:outline-none"
          aria-label="Fotografía anterior"
        >
          <ChevronLeftIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Botón Siguiente */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110 focus:outline-none"
          aria-label="Fotografía siguiente"
        >
          <ChevronRightIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Contenedor Principal de la Imagen */}
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="relative max-w-5xl w-full h-[70vh] sm:h-[80vh] flex flex-col items-center justify-center p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={currentItem.image}
              alt={currentItem.title}
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-contain"
              priority
            />
          </div>

          {/* Pie de Foto Informativo */}
          <div className="w-full mt-3 text-center sm:text-left bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl text-white border border-white/10">
            <h4 className="text-base sm:text-lg font-bold">{currentItem.title}</h4>
            <p className="text-xs sm:text-sm text-gray-300 mt-0.5">{currentItem.description}</p>
          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
