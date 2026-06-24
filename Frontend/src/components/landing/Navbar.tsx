'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { FontSizeToggleButton } from '@/components/common/FontSizeToggleButton';
import { UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm dark:shadow-lg border-b border-gray-200 dark:border-gray-800/80 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" tabIndex={-1} aria-hidden="true" className="flex items-center space-x-3 group">
            <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Hospital del Computador"
                width={280}
                height={55}
                style={{ width: 'auto', height: '52px' }}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo.svg"
                alt=""
                aria-hidden="true"
                width={280}
                height={55}
                style={{ width: 'auto', height: '52px' }}
                priority
              />
            </motion.div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200">
              Inicio
            </Link>
            <a href="#servicios" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200">
              Servicios
            </a>
            <Link href="/consulta" className="text-sm font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200 flex items-center space-x-1">
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>Consultar Orden</span>
            </Link>
          </nav>

          {/* Action Buttons & Theme Toggler */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FontSizeToggleButton />
              <ThemeToggleButton />
            </div>

            <Link 
              href="/consulta" 
              className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-amber-500" />
              <span>Rastrear</span>
            </Link>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/signin" 
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200"
              >
                <UserIcon className="w-4 h-4" />
                <span>Acceso Clientes</span>
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.header>
  );
}
