'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  CheckBadgeIcon, 
  ChatBubbleBottomCenterTextIcon, 
  DocumentCheckIcon, 
  DevicePhoneMobileIcon, 
  PhotoIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    title: 'Consulta Rápida y Sencilla',
    description: 'Con solo tu número de cédula y número de orden, conoce la situación exacta de tu computadora sin necesidad de registro.',
    icon: MagnifyingGlassIcon,
    color: 'from-amber-400 via-amber-500 to-yellow-500',
    shadow: 'shadow-amber-500/20'
  },
  {
    title: 'Presupuestos Transparentes',
    description: 'Accede al desglose detallado de repuestos y mano de obra para aprobar tus presupuestos con total claridad.',
    icon: DocumentCheckIcon,
    color: 'from-yellow-500 via-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/20'
  },
  {
    title: 'Evidencia Fotográfica',
    description: 'Mira las fotos del diagnóstico técnico inicial y los avances de la reparación de tu equipo en alta resolución.',
    icon: PhotoIcon,
    color: 'from-amber-500 via-yellow-400 to-amber-500',
    shadow: 'shadow-yellow-500/20'
  },
  {
    title: 'Comunicación Directa',
    description: 'Mantente en contacto continuo con el técnico especialista asignado y recibe respuestas rápidas a tus dudas.',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'from-blue-600 to-indigo-500',
    shadow: 'shadow-blue-500/20'
  },
  {
    title: 'Notificaciones Instantáneas',
    description: 'Recibe alertas inmediatas en cada cambio de estado de tu orden para que siempre sepas en qué fase está.',
    icon: DevicePhoneMobileIcon,
    color: 'from-amber-600 via-amber-500 to-yellow-500',
    shadow: 'shadow-amber-500/20'
  },
  {
    title: 'Calidad Certificada',
    description: 'Procesos de control de calidad rigurosos antes de entregar tu equipo para asegurar su óptimo rendimiento.',
    icon: CheckBadgeIcon,
    color: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/20'
  },
];

export default function FeaturesSection() {
  return (
    <section id="servicios" className="py-24 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800/80 relative overflow-hidden transition-colors duration-300">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4"
          >
            Todo lo que necesitas para tu tranquilidad
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-base sm:text-xl text-gray-600 dark:text-gray-400"
          >
            En el Hospital del Computador, diseñamos una plataforma pensada en la comodidad, transparencia y rapidez que mereces.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-gray-800/80 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl overflow-hidden backdrop-blur-sm"
              >
                {/* Accent Top Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-7 h-7 text-gray-900" />
                  </div>
                  <span aria-hidden="true" className="text-5xl font-black text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-300 select-none">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300">
                  {item.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                  {item.description}
                </p>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
