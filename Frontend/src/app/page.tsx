import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Footer from '@/components/landing/Footer';

export const metadata = {
  title: 'Hospital del Computador - Gestión Inteligente y Reparación de Equipos',
  description: 'Plataforma líder para el seguimiento y gestión de reparaciones técnicas en tiempo real con total transparencia.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
