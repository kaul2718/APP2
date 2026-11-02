import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import ServicesSection from '@/components/landing/ServicesSection';
import GallerySection from '@/components/landing/GallerySection';
import ProcessSection from '@/components/landing/ProcessSection';
import WhyChooseUsSection from '@/components/landing/WhyChooseUsSection';
import LocationSection from '@/components/landing/LocationSection';
import FaqSection from '@/components/landing/FaqSection';
import FloatingWhatsApp from '@/components/landing/FloatingWhatsApp';
import Footer from '@/components/landing/Footer';

import { getCanonicalUrl, getAbsoluteOrRelativeUrl } from '@/lib/seoConfig';

export const metadata: Metadata = {
  title: {
    absolute: 'Hospital del Computador | Servicio Técnico de Laptops, PCs e Impresoras en Riobamba',
  },
  description: 'Taller y laboratorio especializado en reparación de laptops, microelectrónica de placas, mantenimiento preventivo de computadoras e impresoras en Riobamba, Ecuador. Consulta el estado de tu orden en tiempo real con total transparencia.',
  keywords: [
    'servicio tecnico computadoras riobamba',
    'reparacion laptops riobamba',
    'hospital del computador',
    'mantenimiento pc riobamba',
    'reparacion impresoras riobamba',
    'microelectronica laptops riobamba',
    'cambio de pantalla laptop riobamba',
    'repotenciacion ssd riobamba',
  ],
  authors: [{ name: 'Hospital del Computador' }],
  alternates: {
    canonical: getCanonicalUrl('/'),
  },
  openGraph: {
    title: 'Hospital del Computador | Servicio Técnico Especializado en Riobamba',
    description: 'Taller y laboratorio especializado en computadoras, laptops e impresoras en Riobamba. Transparencia, honestidad y seguimiento en vivo de reparaciones.',
    url: getCanonicalUrl('/'),
    siteName: 'Hospital del Computador',
    locale: 'es_EC',
    type: 'website',
    images: [
      {
        url: getAbsoluteOrRelativeUrl('/images/web-publica/fachada-hospital-del-computador.webp'),
        width: 1200,
        height: 630,
        alt: 'Fachada y laboratorio de Hospital del Computador en Riobamba',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hospital del Computador | Servicio Técnico Especializado en Riobamba',
    description: 'Taller y laboratorio especializado en computadoras, laptops e impresoras en Riobamba.',
    images: [getAbsoluteOrRelativeUrl('/images/web-publica/fachada-hospital-del-computador.webp')],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { LandingConfigProvider, PublicLandingConfig, DEFAULT_CONFIG } from '@/hooks/useLandingConfig';

async function getLandingConfig(): Promise<PublicLandingConfig> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${backendUrl}/configuracion-sistema/publica`, {
      next: { revalidate: 300, tags: ['configuracion-publica'] },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ...DEFAULT_CONFIG,
        ...data,
      };
    }
  } catch (err) {
    // Fallback silencioso a DEFAULT_CONFIG
  }
  return DEFAULT_CONFIG;
}

export default async function Home() {
  const initialConfig = await getLandingConfig();

  return (
    <LandingConfigProvider initialConfig={initialConfig}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-amber-500 selection:text-gray-950 transition-colors duration-300">
        
        {/* Barra de Navegación Fija con Logo Oficial de Configuración */}
        <Navbar />

        {/* Contenido Principal */}
        <main className="flex-grow">
          <HeroSection />
          <AboutSection />
          <ServicesSection />
          <GallerySection />
          <ProcessSection />
          <WhyChooseUsSection />
          <LocationSection />
          <FaqSection />
        </main>

        {/* Botón Flotante de WhatsApp */}
        <FloatingWhatsApp />

        {/* Pie de Página Comercial y Datos Estructurados con Logo Oficial */}
        <Footer />
      </div>
    </LandingConfigProvider>
  );
}
