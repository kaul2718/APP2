'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLandingConfig } from '@/hooks/useLandingConfig';
import { 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon, 
  EnvelopeIcon, 
  ArrowTopRightOnSquareIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function LocationSection() {
  const { config, getWhatsAppLink } = useLandingConfig();

  // URL validada y testeada para inserción de Google Maps
  const embedMapUrl = `https://maps.google.com/maps?q=${config.coordenadas.lat},${config.coordenadas.lng}&hl=es&z=17&output=embed`;

  return (
    <section id="ubicacion" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-950 border-t border-gray-200/80 dark:border-gray-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Encuéntranos en Riobamba</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Ubicación, Horarios y Medios de Contacto
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Visítanos en nuestro local comercial o escríbenos directamente por WhatsApp para coordinar el ingreso de tu equipo.
          </p>
        </div>

        {/* Contenido en 2 Columnas: Datos y Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Columna Izquierda: Tarjetas de Información Oficial */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-5 flex flex-col justify-between space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200/90 dark:border-gray-800 shadow-sm space-y-6">
              
              {/* Dirección */}
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-1">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Dirección del Taller
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                    {config.direccion}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {config.ciudad}, Ecuador
                  </p>
                </div>
              </div>

              {/* Teléfonos y WhatsApp */}
              <div className="flex items-start space-x-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Líneas de Atención
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                    WhatsApp: <span className="text-emerald-600 dark:text-emerald-400">{config.whatsapp}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Convencional: <strong>{config.telefono}</strong>
                  </p>
                </div>
              </div>

              {/* Horarios de Atención */}
              <div className="flex items-start space-x-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-1">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Horarios de Atención
                  </h3>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {config.horarios.lunesViernes}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {config.horarios.sabados}
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                    {config.horarios.domingos}
                  </p>
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className="flex items-start space-x-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-1">
                  <EnvelopeIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Correo Electrónico
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-0.5 break-all">
                    {config.correoContacto}
                  </p>
                </div>
              </div>

            </div>

            {/* Botones de Cómo Llegar y WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={config.coordenadas.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 py-3.5 px-5 rounded-2xl text-sm font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-md hover:scale-102 transition-all duration-200"
              >
                <span>Cómo Llegar (Maps)</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>

              <a
                href={getWhatsAppLink('Hola Hospital del Computador, deseo consultar cómo llegar o consultar sobre un servicio.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 py-3.5 px-5 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:scale-102 transition-all duration-200"
              >
                <PhoneIcon className="w-4 h-4" />
                <span>Escribir al WhatsApp</span>
              </a>
            </div>

          </motion.div>

          {/* Columna Derecha: Mapa Interactivo de Google Maps */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="relative w-full h-[400px] sm:h-[480px] lg:h-full min-h-[380px] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md">
              <iframe
                title="Ubicación de Hospital del Computador en Google Maps"
                src={embedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
