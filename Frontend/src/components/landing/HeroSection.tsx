'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLandingConfig } from '@/hooks/useLandingConfig';
import { 
  MagnifyingGlassIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  WrenchScrewdriverIcon,
  SparklesIcon,
  CheckCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function HeroSection() {
  const { config, getWhatsAppLink } = useLandingConfig();

  return (
    <section id="inicio" className="relative min-h-[90vh] flex items-center justify-center pt-28 sm:pt-32 pb-16 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      
      {/* Luces y degradados de fondo corporativos */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-yellow-500/10 to-blue-600/10 dark:from-amber-500/15 dark:via-yellow-500/10 dark:to-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Trama sutil de cuadrícula técnica */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Mensaje Comercial y Acciones */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8"
          >
            {/* Insignia de Ubicación y Excelencia */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-sm">
              <MapPinIcon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                Taller Especializado en {config.ciudad || 'Riobamba'}, Ecuador
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.12]">
              Reparación y Mantenimiento de Computadoras en Riobamba con{' '}
              <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                Transparencia Total
              </span>
            </h1>

            {/* Descripción Reconciliadora */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Especialistas en microelectrónica de placas, mantenimiento preventivo de laptops y PCs, repotenciación con SSD y reparación de impresoras. Sigue el avance de tu equipo en tiempo real desde nuestro portal público.
            </p>

            {/* Botones de Acción (WhatsApp y Consulta) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={getWhatsAppLink('Hola Hospital del Computador, deseo solicitar un diagnóstico o cotización para mi equipo en Riobamba.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25 hover:scale-102 transition-all duration-300 group"
              >
                <SparklesIcon className="w-5 h-5 text-white" />
                <span>Solicitar Servicio vía WhatsApp</span>
              </a>

              <Link
                href="/consulta"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl text-base font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 shadow-md hover:scale-102 transition-all duration-300 group"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Consultar mi Reparación</span>
              </Link>
            </div>

            {/* Puntos Destacados Reales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-700 dark:text-amber-400">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Órdenes Express</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Atención ágil en el día</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                  <WrenchScrewdriverIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Laboratorio Propio</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Microelectrónica y SMD</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-700 dark:text-emerald-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Garantía por Escrito</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hasta {config.diasGarantiaDefault} días de respaldo</p>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Columna Derecha: Tarjeta Interactiva Animada de Monitoreo Técnico */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative mt-6 lg:mt-0"
          >
            {/* Resplandor decorativo animado de fondo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 via-yellow-500 to-blue-600 rounded-[40px] blur-2xl opacity-20 dark:opacity-30 pointer-events-none" />

            {/* Contenedor Glassmorphism */}
            <div className="relative bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/80 rounded-[32px] p-7 sm:p-8 shadow-2xl space-y-6">
              
              {/* Barra Superior con Semáforo y Estado */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-700/80">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Monitor Técnico</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>En Reparación</span>
                </div>
              </div>

              {/* Simulación Dinámica de Progreso */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-gray-200">
                  <span>Orden #{config.ordenPrefijo || ''}{'00482'.padStart(config.ordenDigitos, '0')}</span>
                  <span className="text-amber-700 dark:text-amber-400 font-extrabold">75% Completado</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-full"
                  />
                </div>
              </div>

              {/* Actividades Técnicas del Taller en Vivo */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Diagnóstico Inicial</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Placa base revisada</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Aprobado</span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                      <WrenchScrewdriverIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Cambio de Componentes</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Instalando SSD NVMe</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">En Proceso</span>
                </div>
              </div>

              {/* Burbuja Flotante de Chat / Mensaje Técnico */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative sm:absolute sm:-bottom-5 sm:-left-5 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center space-x-3 mt-4 sm:mt-0"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-sm shadow-md shrink-0">
                  {config.nombreComercial ? config.nombreComercial.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'HC'}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Técnico Asignado</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">&ldquo;El equipo estará listo hoy a las 5 PM.&rdquo;</p>
                </div>
              </motion.div>

            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
