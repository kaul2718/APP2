'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  WrenchIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Background Gradients & Glows (Dorados y Azul Marino) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 dark:from-amber-500/15 dark:to-yellow-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-amber-400/5 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text & CTAs */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-inner"
            >
              <SparklesIcon className="w-5 h-5 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                Hospital del Computador - Servicio Técnico de Excelencia
              </span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight max-w-2xl mx-auto lg:mx-0">
              El Cuidado que tu Equipo Necesita con{' '}
              <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                Transparencia Total
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Consulta en tiempo real el diagnóstico de tu computadora, aprueba repuestos y mantén una línea directa con nuestros especialistas técnicos certificados.
            </p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link 
                href="/consulta"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl text-base font-bold text-gray-900 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-lg shadow-amber-500/20 dark:shadow-amber-500/25 hover:scale-105 transition-all duration-300 group"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-900 group-hover:scale-110 transition-transform" />
                <span>Consultar mi Orden</span>
              </Link>

              <Link
                href="/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl text-base font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-md hover:scale-105 transition-all duration-300 group"
              >
                <span>Acceso Clientes</span>
                <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm">Seguimiento 24/7</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rastreo instantáneo</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm">Garantía Asegurada</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Repuestos certificados</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <WrenchIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm">Técnicos Expertos</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Personal calificado</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Animated Interactive Card / Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Background glowing frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 via-yellow-500 to-blue-600 rounded-[40px] blur-2xl opacity-20 dark:opacity-30 animate-pulse" />

            <div className="relative bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700/80 rounded-[32px] p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-700/80">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Monitor Técnico</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>En Reparación</span>
                </div>
              </div>

              {/* Progress Simulation */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-gray-200">
                  <span>Orden #00482</span>
                  <span className="text-amber-500">75% Completado</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-full"
                  />
                </div>
              </div>

              {/* Simulated Tech Activities */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Diagnóstico Inicial</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Placa base revisada</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-500">Aprobado</span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 animate-spin">
                      <WrenchIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Cambio de Componentes</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Instalando SSD NVMe</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500">En Proceso</span>
                </div>
              </div>

              {/* Floating Chat Bubble Simulation */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  HC
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Técnico Asignado</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">"El equipo estará listo hoy a las 5 PM."</p>
                </div>
              </motion.div>

            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}
