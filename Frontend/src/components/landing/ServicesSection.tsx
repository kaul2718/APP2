'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SERVICES } from '@/data/landingData';
import { useLandingConfig } from '@/hooks/useLandingConfig';
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  PhoneIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  PrinterIcon,
  TvIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ElementType> = {
  CpuChipIcon,
  WrenchScrewdriverIcon,
  PrinterIcon,
  TvIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
};

export default function ServicesSection() {
  const { getWhatsAppLink } = useLandingConfig();

  return (
    <section id="servicios" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-950 border-t border-gray-200/80 dark:border-gray-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de Sección */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Servicios Profesionales en Riobamba</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Soluciones Integrales para Equipos de Cómputo e Impresión
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Atendemos problemas de hardware y software con diagnósticos rigurosos, repuestos compatibles y atención garantizada en nuestro taller.
          </p>
        </div>

        {/* Grilla de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, idx) => {
            const Icon = iconMap[service.icon] || WrenchScrewdriverIcon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                viewport={{ once: true }}
                className="group flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/90 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-300"
              >
                {/* Imagen del Servicio */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
                  
                  {/* Icono Flotante */}
                  <div className="absolute top-4 left-4 p-2.5 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md text-amber-600 dark:text-amber-400 border border-gray-200/60 dark:border-gray-700/60">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Lista de Características / Alcance */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                    {service.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start space-x-2 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Botón WhatsApp de Consulta */}
                  <div className="pt-4">
                    <a
                      href={getWhatsAppLink(service.whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800/80 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200"
                    >
                      <PhoneIcon className="w-4 h-4 text-emerald-500" />
                      <span>Consultar este servicio vía WhatsApp</span>
                    </a>
                  </div>

                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
