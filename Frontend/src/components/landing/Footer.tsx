'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLandingConfig } from '@/hooks/useLandingConfig';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';

import { getCanonicalUrl, getAbsoluteOrRelativeUrl } from '@/lib/seoConfig';

export default function Footer() {
  const { config, getWhatsAppLink } = useLandingConfig();
  const stableLogo = getAbsoluteOrRelativeUrl('/images/logo/logo.svg');
  const canonicalUrl = getCanonicalUrl('/');

  // Datos estructurados Schema.org para SEO Local en Riobamba (Estándar W3C / Schema.org)
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    name: config.nombreEmpresa || 'Hospital del Computador',
    alternateName: config.nombreComercial || 'Hospital del Computador',
    description: config.slogan || 'Servicio Técnico Especializado en Computación, Laptops y Electrónica en Riobamba',
    serviceType: 'Reparación y Mantenimiento de Computadoras, Laptops e Impresoras',
    image: stableLogo,
    url: canonicalUrl ? `${canonicalUrl}/` : '/',
    telephone: config.whatsapp || config.telefono || '+593969620222',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.direccion || 'Riobamba, Chimborazo, Ecuador',
      addressLocality: config.ciudad || 'Riobamba',
      addressRegion: 'Chimborazo',
      addressCountry: 'EC',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: config.coordenadas.lat,
      longitude: config.coordenadas.lng,
    },
    hasMap: config.coordenadas.googleMapsUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '14:00',
      },
    ],
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-300">
      
      {/* Script JSON-LD para Google Search y SEO Local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-gray-200 dark:border-gray-800">
          
          {/* Columna 1: Marca y Propósito (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative h-11 w-48 sm:w-60 transition-transform duration-200 hover:scale-102">
                <Image
                  src={config.logoUrl || '/images/logo/logo.svg'}
                  alt={config.nombreComercial || config.nombreEmpresa || 'Hospital del Computador'}
                  fill
                  unoptimized
                  sizes="240px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">
              Servicio técnico integral de computadoras, laptops e impresoras en Riobamba. Laboratorio de microelectrónica, diagnóstico formal y seguimiento digital de tu equipo.
            </p>

            <div className="pt-2">
              <Link
                href="/consulta"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-sm transition-all"
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-950" />
                <span>Consultar el Estado de mi Orden</span>
              </Link>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white">
              Navegación
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#inicio" className="hover:text-amber-500 transition-colors">Inicio</Link>
              </li>
              <li>
                <Link href="/#nosotros" className="hover:text-amber-500 transition-colors">Sobre Nosotros</Link>
              </li>
              <li>
                <Link href="/#servicios" className="hover:text-amber-500 transition-colors">Nuestros Servicios</Link>
              </li>
              <li>
                <Link href="/#instalaciones" className="hover:text-amber-500 transition-colors">Nuestras Instalaciones</Link>
              </li>
              <li>
                <Link href="/#proceso" className="hover:text-amber-500 transition-colors">¿Cómo Trabajamos?</Link>
              </li>
              <li>
                <Link href="/#ubicacion" className="hover:text-amber-500 transition-colors">Ubicación y Horarios</Link>
              </li>
              <li>
                <Link href="/#preguntas" className="hover:text-amber-500 transition-colors">Preguntas Frecuentes</Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información de Contacto Directo (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white">
              Contacto y Atención
            </p>
            
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2.5">
                <MapPinIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>{config.direccion}, {config.ciudad}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <PhoneIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors font-semibold"
                >
                  WhatsApp: {config.whatsapp} / Tel: {config.telefono}
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <EnvelopeIcon className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="break-all">{config.correoContacto}</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <ClockIcon className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p>{config.horarios.lunesViernes}</p>
                  <p>{config.horarios.sabados}</p>
                  <p className="text-rose-700 dark:text-rose-400 font-medium">{config.horarios.domingos}</p>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/signin"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Acceso para Empleados y Clientes Registrados</span>
              </Link>
            </div>

          </div>

        </div>

        {/* Pie Inferior de Derechos */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} {config.nombreEmpresa}. Todos los derechos reservados. Riobamba, Ecuador.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0 font-medium">
            <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer transition-colors">
              Términos del Servicio Técnico
            </span>
            <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer transition-colors">
              Políticas de Privacidad
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
