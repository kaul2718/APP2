'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  PhotoIcon, 
  CpuChipIcon, 
  BuildingStorefrontIcon, 
  DocumentCheckIcon, 
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

import { useLandingConfig } from '@/hooks/useLandingConfig';

export default function WhyChooseUsSection() {
  const { config } = useLandingConfig();

  const benefits = [
    {
      title: 'Trazabilidad y Consulta en Vivo',
      desc: 'Consulta en cualquier momento el estado de tu equipo mediante nuestro portal en línea con tu número de ODS y cédula.',
      icon: EyeIcon,
      color: 'from-amber-500 to-yellow-500',
    },
    {
      title: 'Evidencias Fotográficas',
      desc: 'Fotografiamos las condiciones estéticas al ingresar y documentamos las evidencias del trabajo realizado en placa o periféricos.',
      icon: PhotoIcon,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Laboratorio de Microelectrónica',
      desc: 'Reparamos circuitos y placas madre averiadas, ahorrándote el costo excesivo de reemplazar la placa completa cuando tiene solución.',
      icon: CpuChipIcon,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: `Establecimiento Físico en ${config.ciudad || 'Riobamba'}`,
      desc: 'Un local comercial y taller real al que puedes acudir en persona, con atención amable, estacionamiento cercano y fácil acceso.',
      icon: BuildingStorefrontIcon,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Presupuestos Transparentes',
      desc: 'Desglose detallado de repuestos y mano de obra. No instalamos ningún componente sin que antes conozcas y apruebes el valor.',
      icon: DocumentCheckIcon,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Garantía Técnica por Escrito',
      desc: `Toda reparación cuenta con Acta de Entrega con período de garantía de hasta ${config.diasGarantiaDefault} días sobre el servicio realizado en nuestro taller.`,
      icon: ShieldCheckIcon,
      color: 'from-emerald-500 to-green-600',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Beneficios Reales y Comprobables</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            ¿Por Qué Confiar en {config.nombreComercial || 'Hospital del Computador'}?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Principios claros de servicio, equipamiento técnico e infraestructura orientada a proteger tu inversión tecnológica.
          </p>
        </div>

        {/* Grilla de Beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 hover:border-amber-400/60 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${b.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {b.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {b.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
