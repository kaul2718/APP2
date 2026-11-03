'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PublicLandingConfig {
  nombreEmpresa: string;
  nombreComercial: string;
  slogan: string;
  telefono: string;
  whatsapp: string;
  correoContacto: string;
  direccion: string;
  ciudad: string;
  logoUrl: string | null;
  ruc: string;
  diasGarantiaDefault: number;
  tiempoLimiteDiagnosticoHoras: number;
  ordenPrefijo: string;
  ordenDigitos: number;
  coordenadas: {
    lat: number;
    lng: number;
    googleMapsUrl: string;
  };
  horarios: {
    lunesViernes: string;
    sabados: string;
    domingos: string;
  };
}

export const DEFAULT_CONFIG: PublicLandingConfig = {
  nombreEmpresa: 'Hospital del Computador',
  nombreComercial: 'Hospital del Computador',
  slogan: 'Servicio Técnico Especializado en Computación, Laptops y Electrónica',
  telefono: '022123456',
  whatsapp: '0969620222',
  correoContacto: 'soporte@elhospitaldelcomputador.com',
  direccion: 'Riobamba, Chimborazo, Ecuador',
  ciudad: 'Riobamba',
  logoUrl: '/images/logo/logo.svg',
  ruc: '0605376300001',
  diasGarantiaDefault: 90,
  tiempoLimiteDiagnosticoHoras: 48,
  ordenPrefijo: '',
  ordenDigitos: 5,
  coordenadas: {
    lat: -1.666199,
    lng: -78.6550158,
    googleMapsUrl: 'https://maps.app.goo.gl/zpips5vrKuky1DjC9',
  },
  horarios: {
    lunesViernes: 'Lunes a Viernes: 8:00 AM - 6:30 PM',
    sabados: 'Sábados: 9:00 AM - 2:00 PM',
    domingos: 'Domingos: Cerrado',
  },
};

interface LandingConfigContextType {
  config: PublicLandingConfig;
  loading: boolean;
  getWhatsAppLink: (message?: string) => string;
}

const LandingConfigContext = createContext<LandingConfigContextType | null>(null);

export function LandingConfigProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode;
  initialConfig?: PublicLandingConfig;
}) {
  const [config, setConfig] = useState<PublicLandingConfig>(
    initialConfig || DEFAULT_CONFIG
  );
  const [loading, setLoading] = useState<boolean>(!initialConfig);

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${backendUrl}/configuracion-sistema/publica`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setConfig((prev) => ({
              ...DEFAULT_CONFIG,
              ...prev,
              ...data,
              logoUrl: data.logoUrl || prev.logoUrl || DEFAULT_CONFIG.logoUrl,
            }));
          }
        }
      } catch (err) {
        // Fallback silencioso
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const getWhatsAppLink = (message?: string) => {
    const rawNumber = config.whatsapp || '0969620222';
    const digitsOnly = rawNumber.replace(/\D/g, '');
    let formattedNumber = digitsOnly;
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '593' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('593')) {
      formattedNumber = '593' + formattedNumber;
    }

    const defaultMsg = `Hola ${config.nombreComercial || 'Hospital del Computador'}, deseo solicitar información sobre el servicio técnico.`;
    const finalMsg = encodeURIComponent(message || defaultMsg);
    return `https://wa.me/${formattedNumber}?text=${finalMsg}`;
  };

  return React.createElement(
    LandingConfigContext.Provider,
    { value: { config, loading, getWhatsAppLink } },
    children
  );
}

export function useLandingConfig() {
  const context = useContext(LandingConfigContext);
  if (context) {
    return context;
  }

  // Fallback estático seguro si se usa fuera de un Provider
  const getWhatsAppLink = (message?: string) => {
    const rawNumber = DEFAULT_CONFIG.whatsapp || '0969620222';
    const digitsOnly = rawNumber.replace(/\D/g, '');
    let formattedNumber = digitsOnly;
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '593' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('593')) {
      formattedNumber = '593' + formattedNumber;
    }

    const defaultMsg = `Hola ${DEFAULT_CONFIG.nombreComercial || 'Hospital del Computador'}, deseo solicitar información sobre el servicio técnico.`;
    const finalMsg = encodeURIComponent(message || defaultMsg);
    return `https://wa.me/${formattedNumber}?text=${finalMsg}`;
  };

  return { config: DEFAULT_CONFIG, loading: false, getWhatsAppLink };
}
