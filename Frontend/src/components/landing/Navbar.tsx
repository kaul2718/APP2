'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { FontSizeToggleButton } from '@/components/common/FontSizeToggleButton';
import { useLandingConfig } from '@/hooks/useLandingConfig';
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  XMarkIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { config, getWhatsAppLink } = useLandingConfig();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '/#inicio' },
    { name: 'Nosotros', href: '/#nosotros' },
    { name: 'Servicios', href: '/#servicios' },
    { name: 'Instalaciones', href: '/#instalaciones' },
    { name: 'Proceso', href: '/#proceso' },
    { name: 'Ubicación', href: '/#ubicacion' },
    { name: 'Preguntas', href: '/#preguntas' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md border-b border-gray-200/80 dark:border-gray-800/80 py-2.5'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 py-3.5'
      }`}
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo Corporativo Oficial */}
          <Link href="/" className="flex items-center shrink-0 group focus:outline-none">
            <div className="relative h-11 w-48 sm:w-60 transition-transform duration-200 group-hover:scale-102">
              <Image
                src={config.logoUrl || '/images/logo/logo.svg'}
                alt={config.nombreComercial || config.nombreEmpresa || 'Hospital del Computador'}
                fill
                unoptimized
                sizes="(max-width: 640px) 192px, 240px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Menú de Navegación de Escritorio */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs xl:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 whitespace-nowrap transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Acciones y Botones Principales */}
          <div className="hidden sm:flex items-center gap-2 xl:gap-3 shrink-0">
            <FontSizeToggleButton />
            <ThemeToggleButton />

            {/* CTA Rastrear Reparación */}
            <Link
              href="/consulta"
              className="whitespace-nowrap inline-flex items-center space-x-1.5 xl:space-x-2 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold text-gray-800 dark:text-gray-100 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/80 dark:border-amber-600/50 shadow-sm transition-all duration-200 hover:scale-102"
              title="Consultar el estado de mi orden en vivo"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Consultar Reparación</span>
            </Link>

            {/* CTA WhatsApp Oficial */}
            <a
              href={getWhatsAppLink('Hola Hospital del Computador, deseo solicitar información sobre atención en taller.')}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap inline-flex items-center space-x-1.5 xl:space-x-2 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm shadow-emerald-500/20 transition-all duration-200 hover:scale-102"
            >
              <PhoneIcon className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </a>

            {/* Botón Iniciar Sesión / Portal */}
            <Link
              href="/signin"
              className="whitespace-nowrap inline-flex items-center space-x-1.5 xl:space-x-2 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-800/90 hover:bg-gray-200 dark:hover:bg-gray-700/90 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:border-amber-400/50 dark:hover:border-amber-400/50 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 hover:scale-102 shrink-0 group"
              title="Portal del Sistema y Clientes"
            >
              <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              <span className="hidden xl:inline">Iniciar Sesión</span>
              <span className="inline xl:hidden">Acceso</span>
            </Link>
          </div>

          {/* Botón de Menú Móvil */}
          <div className="flex items-center space-x-2 lg:hidden">
            <ThemeToggleButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6 text-gray-900 dark:text-white" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-gray-900 dark:text-white" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-3 pb-6 shadow-xl"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-amber-500"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col space-y-2.5">
                <Link
                  href="/consulta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl text-base font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-md"
                >
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-900" />
                  <span>Consultar mi Reparación</span>
                </Link>

                <a
                  href={getWhatsAppLink('Hola Hospital del Computador, deseo solicitar información sobre atención en taller.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Contactar por WhatsApp</span>
                </a>

                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                >
                  <UserIcon className="w-4 h-4 text-amber-500" />
                  <span>Iniciar Sesión (Sistema / Clientes)</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
