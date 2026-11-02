'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { WORK_PROCESS } from '@/data/landingData';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon,
  DocumentTextIcon,
  CpuChipIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

import { useLandingConfig } from '@/hooks/useLandingConfig';

const iconMap: Record<string, React.ElementType> = {
  DocumentTextIcon,
  CpuChipIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
};

export default function ProcessSection() {
  const { config } = useLandingConfig();
  return (
    <section id="proceso" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-950 border-t border-gray-200/80 dark:border-gray-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Paso a Paso Transparente</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            ¿Cómo Trabajamos en Cada Reparación?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Un flujo claro y documentado desde que dejas tu equipo en counter hasta que lo retiras funcionando con garantía.
          </p>
        </div>

        {/* Pasos del Proceso */}
        <div className="relative">
          
          {/* Línea conectora central en escritorio */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-emerald-500 -translate-y-1/2 z-0 opacity-20" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            {WORK_PROCESS.map((proc, idx) => {
              const Icon = iconMap[proc.icon] || WrenchScrewdriverIcon;
              return (
                <motion.div
                  key={proc.stepNumber}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:border-amber-400/50 transition-all duration-300 space-y-4"
                >
                  {/* Número y Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-amber-500/80">
                      {proc.stepNumber}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {proc.badge}
                    </span>
                  </div>

                  {/* Icono */}
                  <div className="p-3 w-fit rounded-2xl bg-gray-50 dark:bg-gray-800 text-amber-600 dark:text-amber-400">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Título y Descripción */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {proc.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {proc.description}
                    </p>
                  </div>

                  {/* Detalle inferior */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {proc.stepNumber === '05'
                      ? `Cada servicio técnico incluye garantía de hasta ${config.diasGarantiaDefault} días sobre la mano de obra realizada.`
                      : proc.detail}
                  </div>

                </motion.div>
              );
            })}
          </div>

        </div>

        {/* Banner CTA Destacado de Consulta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-20 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-gray-950 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-gray-950 text-amber-400 uppercase tracking-wider">
              Seguimiento Público en Tiempo Real
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-950">
              ¿Tienes un equipo actualmente en nuestro taller?
            </h3>
            <p className="text-sm sm:text-base text-gray-900 font-medium max-w-xl">
              Ingresa con tu número de Orden de Servicio y tu Cédula para ver fotografías del diagnóstico, estado y cotización aprobada.
            </p>
          </div>

          <Link
            href="/consulta"
            className="shrink-0 inline-flex items-center space-x-3 px-8 py-4 rounded-2xl text-base font-black text-white bg-gray-950 hover:bg-gray-900 shadow-lg hover:scale-105 transition-all duration-300"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-amber-400" />
            <span>Consultar mi Reparación</span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
