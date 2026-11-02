'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GALLERY_ITEMS, GalleryItem } from '@/data/landingData';
import LightboxModal from './LightboxModal';
import { 
  PhotoIcon, 
  ArrowsPointingOutIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

type FilterCategory = 'all' | 'taller' | 'recepcion' | 'exterior' | 'equipamiento';

export default function GallerySection() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filterTabs = [
    { id: 'all', label: 'Todas las Instalaciones' },
    { id: 'recepcion', label: 'Recepción y Atención' },
    { id: 'taller', label: 'Taller y Laboratorio' },
    { id: 'exterior', label: 'Fachada y Acceso' },
    { id: 'equipamiento', label: 'Insumos y Vitrinas' },
  ];

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const openLightbox = (item: GalleryItem) => {
    const idx = GALLERY_ITEMS.findIndex((g) => g.id === item.id);
    setCurrentIndex(idx !== -1 ? idx : 0);
    setLightboxOpen(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % GALLERY_ITEMS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
  };

  return (
    <section id="instalaciones" className="py-20 sm:py-28 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Nuestras Instalaciones Reales</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Espacios Diseñados para Cuidar tu Tecnología
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Conoce nuestro taller, área de microelectrónica, recepción de clientes y vitrinas de componentes en Riobamba. Fotografías 100% auténticas de nuestras instalaciones.
          </p>
        </div>

        {/* Filtros por Categoría */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as FilterCategory)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mosaico de Fotografías */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              onClick={() => openLightbox(item)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 ${
                item.featured ? 'sm:col-span-2 sm:row-span-2 h-80 sm:h-[420px]' : 'h-64 sm:h-72'
              }`}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Degradado y Capa Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Botón Flotante de Zoom */}
              <div className="absolute top-3 right-3 p-2 rounded-xl bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </div>

              {/* Texto en Pie de Tarjeta */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-gray-950 uppercase tracking-wider mb-1.5">
                  {item.categoryLabel}
                </span>
                <h3 className="text-sm sm:text-base font-bold drop-shadow leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2 font-normal opacity-90">
                  {item.description}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>

      {/* Visor Lightbox */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        currentIndex={currentIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        items={GALLERY_ITEMS}
      />
    </section>
  );
}
