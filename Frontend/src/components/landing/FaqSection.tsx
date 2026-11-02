'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingConfig } from '@/hooks/useLandingConfig';
import { 
  ChevronDownIcon, 
  QuestionMarkCircleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { config } = useLandingConfig();

  const faqs = [
    {
      question: '¿Cómo puedo saber en qué estado se encuentra mi reparación?',
      answer: 'Puedes ingresar en cualquier momento a la sección "Consultar mi reparación" en este sitio web. Solo necesitas ingresar tu número de Orden de Servicio (ODS) y tu número de cédula para ver el estado en vivo, el técnico asignado, las fotografías de evidencia y el presupuesto aprobado.',
    },
    {
      question: '¿Cuánto tiempo toma el diagnóstico de una computadora?',
      answer: `Para órdenes Express (mantenimiento preventivo, reinstalación de software básico o cambio de pasta térmica), el tiempo es de 2 a 4 horas. Para diagnósticos complejos de electrónica o fallas intermitentes, el peritaje toma habitualmente hasta ${config.tiempoLimiteDiagnosticoHoras} horas laborables.`,
    },
    {
      question: '¿Qué sucede si no apruebo el presupuesto de un repuesto?',
      answer: 'Si tras el diagnóstico no deseas adquirir el repuesto sugerido, la orden se cierra sin ningún cargo por el componente y tu equipo se te devuelve en las condiciones exactas en que ingresó.',
    },
    {
      question: '¿Qué documentos recibo al dejar y retirar mi equipo?',
      answer: `Al ingresar recibes el Acta de Recepción con la descripción física, accesorios y número de ODS. Al retirar, tras verificar tu equipo encendido y funcional, se emite el Acta de Entrega con los términos y período de garantía de hasta ${config.diasGarantiaDefault} días sobre el servicio realizado.`,
    },
    {
      question: '¿Qué formas de contacto tienen para emergencias o dudas técnicas?',
      answer: `Nuestro canal principal y más rápido es WhatsApp (${config.whatsapp}), donde te atenderemos en nuestro horario habitual. También puedes visitarnos directamente en nuestro local en ${config.ciudad} (${config.direccion}) o llamarnos a nuestro teléfono fijo (${config.telefono}).`,
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="preguntas" className="py-20 sm:py-28 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Resuelve tus Dudas</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Conoce cómo gestionamos los diagnósticos, presupuestos, tiempos de entrega y garantías de servicio.
          </p>
        </div>

        {/* Acordeón de Preguntas */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800/40 hover:border-amber-400/50 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center space-x-3.5 pr-4">
                    <QuestionMarkCircleIcon className={`w-5 h-5 shrink-0 ${isOpen ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'transform rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-200/50 dark:border-gray-700/50">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
