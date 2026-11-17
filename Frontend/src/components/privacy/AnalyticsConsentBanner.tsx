'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  getClientAnalyticsConsentState,
  setClientAnalyticsConsent,
} from '@/lib/clientActivityTracker';

export default function AnalyticsConsentBanner() {
  const [consentState, setConsentState] = useState<'granted' | 'denied' | 'unset' | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    setConsentState(getClientAnalyticsConsentState());
  }, []);

  if (consentState === null) return null;

  const isBannerOpen = consentState === 'unset' || showPreferences;

  const handleDecision = (granted: boolean) => {
    setClientAnalyticsConsent(granted);
    setConsentState(granted ? 'granted' : 'denied');
    setShowPreferences(false);
  };

  if (!isBannerOpen) {
    return (
      <div className="fixed bottom-3 right-3 z-40">
        <button
          type="button"
          onClick={() => setShowPreferences(true)}
          aria-label="Cambiar preferencias de privacidad y analítica"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-md transition-colors hover:border-amber-500/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <ShieldCheckIcon className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <span>Privacidad ({consentState === 'granted' ? 'Activa' : 'Solo esencial'})</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="privacy-banner-title"
      aria-describedby="privacy-banner-desc"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 p-4 sm:p-5 text-slate-100 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-amber-500/15 p-2 text-amber-400 shrink-0">
            <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="privacy-banner-title" className="text-sm font-bold text-white">
              Preferencias de privacidad y analítica de uso
            </h3>
            <p id="privacy-banner-desc" className="mt-1 text-xs leading-relaxed text-slate-300">
              Utilizamos contadores técnicos estrictamente necesarios en el servidor para la seguridad y
              disponibilidad del servicio. De forma opcional, puedes autorizar la medición anónima de navegación
              y uso de secciones para mejorar la experiencia del portal.{' '}
              <strong className="font-semibold text-white">
                Nunca registramos contraseñas, cédulas, firmas ni contenido de formularios.
              </strong>
            </p>
          </div>
        </div>
        {consentState !== 'unset' && (
          <button
            type="button"
            onClick={() => setShowPreferences(false)}
            aria-label="Cerrar preferencias de privacidad"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
        <button
          type="button"
          onClick={() => handleDecision(false)}
          className="w-full sm:w-auto rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Rechazar analítica opcional
        </button>
        <button
          type="button"
          onClick={() => handleDecision(true)}
          className="w-full sm:w-auto rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          Aceptar medición anónima
        </button>
      </div>
    </div>
  );
}

