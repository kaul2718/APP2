'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800/80 py-16 text-gray-600 dark:text-gray-400 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" tabIndex={-1} aria-hidden="true" className="flex items-center space-x-3 group">
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Hospital del Computador"
                width={200}
                height={36}
                style={{ width: 'auto', height: '32px' }}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo.svg"
                alt=""
                aria-hidden="true"
                width={200}
                height={36}
                style={{ width: 'auto', height: '32px' }}
                priority
              />
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              Hospital del Computador. Plataforma líder de gestión técnica y atención al cliente. Transparencia, rapidez y confianza en cada reparación.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-gray-900 dark:text-white">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <a href="#servicios" className="hover:text-blue-600 dark:hover:text-white transition-colors">Servicios</a>
              </li>
              <li>
                <Link href="/consulta" className="hover:text-blue-600 dark:hover:text-white transition-colors text-blue-600 dark:text-blue-400 font-medium">Consultar Orden</Link>
              </li>
              <li>
                <Link href="/signin" className="hover:text-blue-600 dark:hover:text-white transition-colors">Acceso Clientes</Link>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wider uppercase text-gray-900 dark:text-white">Soporte</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Lunes a Viernes: 8:00 AM - 6:00 PM</li>
              <li>Sábados: 9:00 AM - 1:00 PM</li>
              <li>soporte@hospitaldelcomputador.com</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Hospital del Computador. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0 font-medium">
            <span className="hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer transition-colors">Términos de Servicio</span>
            <span className="hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer transition-colors">Política de Privacidad</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
