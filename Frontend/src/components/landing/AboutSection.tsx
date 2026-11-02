'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  CheckBadgeIcon, 
  ShieldCheckIcon, 
  DocumentCheckIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { useLandingConfig } from '@/hooks/useLandingConfig';

export default function AboutSection() {
  const { config } = useLandingConfig();

  const pilares = [
    {
      title: 'Diagnóstico Técnico Real',
      desc: 'Revisamos minuciosamente cada equipo con herramientas de medición electrónica. Explicamos con claridad el origen de la falla sin tecnicismos confusos ni diagnósticos inventados.',
      icon: CheckBadgeIcon,
    },
    {
      title: 'Peritaje y Respaldo Legal',
      desc: 'Cada ingreso genera un Acta de Recepción con número de serie, peritaje fotográfico y detalle de accesorios para tu total tranquilidad y seguridad.',
      icon: DocumentCheckIcon,
    },
    {
      title: 'Garantía Escrita de Servicio',
      desc: 'Toda intervención técnica finalizada cuenta con su correspondiente Acta de Entrega y garantía sobre la mano de obra realizada en nuestro taller.',
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <section id="nosotros" className="py-20 sm:py-28 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Columna Izquierda: Fotografías Reales en Composición */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:col-span-6 relative"
          >
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              
              {/* Imagen Principal: Recepción y Counter */}
              <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                <Image
                  src="/images/web-publica/recepcion-principal.webp"
                  alt="Área de recepción y atención de Hospital del Computador en Riobamba"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-bold">Atención personalizada y recepción formal en Riobamba</p>
                </div>
              </div>

              {/* Imagen Secundaria Superpuesta: Taller y Microscopio */}
              <div className="absolute -bottom-8 -right-4 sm:-right-8 w-3/5 h-44 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 hidden sm:block">
                <Image
                  src="/images/web-publica/laboratorio-microelectronica.webp"
                  alt="Laboratorio de microelectrónica de Hospital del Computador en Riobamba"
                  fill
                  sizes="35vw"
                  className="object-cover object-center hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-gray-900/80 backdrop-blur-sm rounded-lg text-white text-[11px] font-semibold text-center">
                  Laboratorio de Reparación Electrónica
                </div>
              </div>

            </div>
          </motion.div>

          {/* Columna Derecha: Texto Explicativo y Valores */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:col-span-6 space-y-6 sm:space-y-8"
          >
            <div>
              <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <SparklesIcon className="w-4 h-4" />
                <span>Sobre {config.nombreComercial || 'Hospital del Computador'}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-2 leading-tight">
                Vocación Técnica, Honestidad y Compromiso con tu Equipo
              </h2>
            </div>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              En <strong>{config.nombreComercial || 'Hospital del Computador'}</strong> entendemos que tu computadora, laptop o impresora es una herramienta indispensable para tu trabajo, estudios y vida cotidiana. Por ello, hemos establecido un estándar de servicio en {config.ciudad || 'Riobamba'} basado en la honestidad, el equipamiento técnico real y la documentación formal de cada procedimiento.
            </p>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Contamos con banco de trabajo acondicionado, instrumental de precisión para microelectrónica y un sistema informático que te permite verificar qué técnico está atendiendo tu equipo, qué repuestos fueron instalados y qué pruebas de calidad superó antes de su entrega.
            </p>

            {/* Lista de Pilares */}
            <div className="space-y-4 pt-2">
              {pilares.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="flex items-start space-x-3.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl mt-0.5 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{p.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}
