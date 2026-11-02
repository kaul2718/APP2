'use client';

import React, { useState, useEffect, useRef } from "react";
import {
  ChecklistTemplate,
  EstadoEncendido,
  EstadoFisico,
  EstadoFuncional,
  InspeccionItemFisico,
  InspeccionItemFuncional,
  InspeccionRecepcionData,
} from "@/types/checklist.types";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  MinusCircleIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";

interface Props {
  template?: ChecklistTemplate | null;
  tipoEquipoNombre?: string;
  onChange: (data: InspeccionRecepcionData) => void;
  initialData?: InspeccionRecepcionData;
}

// Opciones de Encendido
const opcionesEncendido: {
  value: EstadoEncendido;
  label: string;
  badge: string;
  icon: any;
  activeClass: string;
}[] = [
  {
    value: 'no_probado',
    label: 'No probado al recibir',
    badge: 'Sin prueba',
    icon: QuestionMarkCircleIcon,
    activeClass: 'bg-gray-100 text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-500',
  },
  {
    value: 'correcto',
    label: 'Enciende correctamente',
    badge: 'Enciende OK',
    icon: CheckCircleIcon,
    activeClass: 'bg-green-50 text-green-700 border-green-500 dark:bg-green-950/40 dark:text-green-300 dark:border-green-500',
  },
  {
    value: 'falla',
    label: 'No enciende / Falla',
    badge: 'No enciende',
    icon: XCircleIcon,
    activeClass: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500',
  },
  {
    value: 'intermitente',
    label: 'Encendido intermitente',
    badge: 'Intermitente',
    icon: BoltIcon,
    activeClass: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500',
  },
];

// Opciones de Inspección Física (Aspecto y Estructura)
const opcionesFisicas: {
  value: EstadoFisico;
  label: string;
  shortLabel: string;
  icon: any;
  activeClass: string;
}[] = [
  {
    value: 'no_revisado',
    label: 'No revisado',
    shortLabel: 'No revisado',
    icon: QuestionMarkCircleIcon,
    activeClass: 'bg-gray-100 text-gray-700 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-500 font-bold',
  },
  {
    value: 'bueno',
    label: 'Buen estado',
    shortLabel: 'Bueno',
    icon: CheckCircleIcon,
    activeClass: 'bg-green-50 text-green-700 border-green-500 dark:bg-green-950/40 dark:text-green-300 dark:border-green-500 font-bold',
  },
  {
    value: 'desgaste',
    label: 'Rayones / Desgaste leve',
    shortLabel: 'Rayones',
    icon: MinusCircleIcon,
    activeClass: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500 font-bold',
  },
  {
    value: 'danado',
    label: 'Golpe / Fisura / Deformación',
    shortLabel: 'Golpe',
    icon: ExclamationTriangleIcon,
    activeClass: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-500 font-bold',
  },
  {
    value: 'roto',
    label: 'Roto / Faltante / Quebrado',
    shortLabel: 'Roto/Falta',
    icon: XCircleIcon,
    activeClass: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500 font-bold',
  },
  {
    value: 'no_aplica',
    label: 'No aplica',
    shortLabel: 'N/A',
    icon: MinusCircleIcon,
    activeClass: 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
  },
];

// Opciones de Verificación Funcional
const opcionesFuncionales: {
  value: EstadoFuncional;
  label: string;
  shortLabel: string;
  icon: any;
  activeClass: string;
}[] = [
  {
    value: 'no_probado',
    label: 'No probado al recibir',
    shortLabel: 'No probado',
    icon: QuestionMarkCircleIcon,
    activeClass: 'bg-gray-100 text-gray-700 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-500 font-bold',
  },
  {
    value: 'funciona',
    label: 'Funciona correctamente',
    shortLabel: 'Funciona',
    icon: CheckCircleIcon,
    activeClass: 'bg-green-50 text-green-700 border-green-500 dark:bg-green-950/40 dark:text-green-300 dark:border-green-500 font-bold',
  },
  {
    value: 'falla',
    label: 'Falla confirmada en recepción',
    shortLabel: 'Falla',
    icon: XCircleIcon,
    activeClass: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500 font-bold',
  },
  {
    value: 'intermitente',
    label: 'Comportamiento intermitente',
    shortLabel: 'Intermitente',
    icon: BoltIcon,
    activeClass: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500 font-bold',
  },
  {
    value: 'no_aplica',
    label: 'No aplica',
    shortLabel: 'N/A',
    icon: MinusCircleIcon,
    activeClass: 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
  },
];

// Listas estándar de respaldo según categoría
const fallbackItemsLaptop = {
  fisica: [
    'Carcasa exterior y tapas',
    'Pantalla / Cristal / Bisel',
    'Bisagras y mecanismo de apertura',
    'Teclado físico y teclas',
    'Puertos USB / HDMI / Conector DC',
    'Tornillería y sellos de chasis',
  ],
  funcional: [
    'Encendido / POST',
    'Imagen en pantalla / Display',
    'Teclado (respuesta teclas)',
    'Touchpad y botones',
    'Batería (retención de carga)',
    'Reconocimiento de cargador',
    'Audio y altavoces',
    'Conectividad WiFi / Red',
  ],
};

const fallbackItemsPC = {
  fisica: [
    'Gabinete / Chasis exterior',
    'Panel frontal y botones de encendido',
    'Puertos frontales y traseros',
    'Tapas laterales y tornillos',
  ],
  funcional: [
    'Encendido / Fuente de poder',
    'Salida de video (POST)',
    'Puertos USB y periféricos',
    'Audio / Salida jack',
    'Conectividad Red / Ethernet',
    'Ventiladores y refrigeración',
  ],
};

const fallbackItemsImpresora = {
  fisica: [
    'Carcasa exterior y cubiertas',
    'Bandejas de entrada y salida de papel',
    'Cristal de escáner y bisagras',
    'Tanques de tinta / Compartimiento tóner',
    'Conectores USB y corriente',
  ],
  funcional: [
    'Encendido / Luces LED indicadoras',
    'Mecanismo de arrastre de papel',
    'Impresión de página de prueba',
    'Movimiento de carro de cabezales',
    'Escáner y fotocopia',
  ],
};

const fallbackItemsGeneral = {
  fisica: [
    'Carcasa / Estructura exterior',
    'Pantalla / Panel frontal (si aplica)',
    'Conectores y puertos de alimentación',
  ],
  funcional: [
    'Encendido / Arranque',
    'Respuesta funcional principal',
    'Conexiones y puertos',
  ],
};

function getInitialFisicos(
  initialData?: InspeccionRecepcionData,
  template?: ChecklistTemplate | null,
  tipoEquipoNombre = ''
): InspeccionItemFisico[] {
  if (initialData?.fisica && initialData.fisica.length > 0) {
    return initialData.fisica;
  }

  let rawList: string[] = [];
  if (template?.items) {
    if (Array.isArray(template.items)) {
      rawList = template.items;
    } else if (template.items.fisica) {
      return template.items.fisica.map((item: string) => ({
        item,
        estado: 'no_revisado' as EstadoFisico, // ESTADO INICIAL SEGURO
        observaciones: '',
      }));
    }
  }

  if (rawList.length > 0) {
    const matchFisico = rawList.filter(it =>
      /carcasa|tapa|bisagra|pantalla|vidrio|cristal|panel|chasis|gabinete|teclado fisico|puerto|conector|tornillo|boton/i.test(it)
    );
    if (matchFisico.length > 0) {
      return matchFisico.map(item => ({
        item,
        estado: 'no_revisado',
        observaciones: '',
      }));
    }
  }

  const eq = tipoEquipoNombre.toLowerCase();
  const source = eq.includes('laptop') || eq.includes('portatil')
    ? fallbackItemsLaptop.fisica
    : eq.includes('pc') || eq.includes('torre') || eq.includes('escritorio')
    ? fallbackItemsPC.fisica
    : eq.includes('impresora')
    ? fallbackItemsImpresora.fisica
    : fallbackItemsGeneral.fisica;

  return source.map(item => ({
    item,
    estado: 'no_revisado',
    observaciones: '',
  }));
}

function getInitialFuncionales(
  initialData?: InspeccionRecepcionData,
  template?: ChecklistTemplate | null,
  tipoEquipoNombre = ''
): InspeccionItemFuncional[] {
  if (initialData?.funcional && initialData.funcional.length > 0) {
    return initialData.funcional;
  }

  let rawList: string[] = [];
  if (template?.items) {
    if (Array.isArray(template.items)) {
      rawList = template.items;
    } else if (template.items.funcional) {
      return template.items.funcional.map((item: string) => ({
        item,
        estado: 'no_probado' as EstadoFuncional, // ESTADO INICIAL SEGURO
        observaciones: '',
      }));
    }
  }

  if (rawList.length > 0) {
    const matchFuncional = rawList.filter(it =>
      !/carcasa|tapa|bisagra|tornillo|chasis/i.test(it) &&
      !/^(enciende|encendido|power)$/i.test(it.trim())
    );
    if (matchFuncional.length > 0) {
      return matchFuncional.map(item => ({
        item,
        estado: 'no_probado',
        observaciones: '',
      }));
    }
  }

  const eq = tipoEquipoNombre.toLowerCase();
  const source = eq.includes('laptop') || eq.includes('portatil')
    ? fallbackItemsLaptop.funcional
    : eq.includes('pc') || eq.includes('torre') || eq.includes('escritorio')
    ? fallbackItemsPC.funcional
    : eq.includes('impresora')
    ? fallbackItemsImpresora.funcional
    : fallbackItemsGeneral.funcional;

  return source.map(item => ({
    item,
    estado: 'no_probado',
    observaciones: '',
  }));
}

export default function InspeccionRecepcionForm({
  template,
  tipoEquipoNombre = '',
  onChange,
  initialData,
}: Props) {
  // Referencia mutable para onChange que previene bucles de render con useCallback/useEffect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Fecha fija de la sesión de inspección
  const fechaRef = useRef(initialData?.fecha || new Date().toISOString());

  // Bandera para proteger las ediciones manuales del usuario ante cambios de prop
  const userEditedRef = useRef(false);

  // Registro del último JSON serializado emitido para evitar ciclos de render
  const lastEmittedRef = useRef<string>('');

  // Estado de encendido (seguro: default 'no_probado')
  const [estadoEncendido, setEstadoEncendido] = useState<EstadoEncendido>(
    initialData?.estadoEncendido || 'no_probado'
  );

  // Observación general de recepción
  const [observacionGeneral, setObservacionGeneral] = useState<string>(
    initialData?.observacionGeneral || ''
  );

  // Extraer ítems físicos y funcionales
  const [itemsFisicos, setItemsFisicos] = useState<InspeccionItemFisico[]>(() =>
    getInitialFisicos(initialData, template, tipoEquipoNombre)
  );

  const [itemsFuncionales, setItemsFuncionales] = useState<InspeccionItemFuncional[]>(() =>
    getInitialFuncionales(initialData, template, tipoEquipoNombre)
  );

  // Actualizar listas si la plantilla o el equipo cambian externamente (y el usuario aún no editó)
  useEffect(() => {
    if (userEditedRef.current || (initialData?.fisica && initialData.fisica.length > 0)) {
      return;
    }
    setItemsFisicos(getInitialFisicos(initialData, template, tipoEquipoNombre));
    setItemsFuncionales(getInitialFuncionales(initialData, template, tipoEquipoNombre));
  }, [template?.id, tipoEquipoNombre]);

  // Notificar cambios hacia el formulario padre de forma segura y controlada
  useEffect(() => {
    const payload: InspeccionRecepcionData = {
      fecha: fechaRef.current,
      estadoEncendido,
      observacionGeneral,
      fisica: itemsFisicos,
      funcional: itemsFuncionales,
    };
    const serialized = JSON.stringify(payload);
    if (serialized !== lastEmittedRef.current) {
      lastEmittedRef.current = serialized;
      onChangeRef.current(payload);
    }
  }, [estadoEncendido, observacionGeneral, itemsFisicos, itemsFuncionales]);

  // Manejador de cambio para ítem físico
  const updateFisico = (index: number, field: keyof InspeccionItemFisico, val: any) => {
    userEditedRef.current = true;
    setItemsFisicos(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Manejador de cambio para ítem funcional
  const updateFuncional = (index: number, field: keyof InspeccionItemFuncional, val: any) => {
    userEditedRef.current = true;
    setItemsFuncionales(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Acción rápida: Marcar física pendiente como Buen estado
  const handleMarcarFisicaBueno = () => {
    userEditedRef.current = true;
    setItemsFisicos(prev =>
      prev.map(it => (it.estado === 'no_revisado' ? { ...it, estado: 'bueno' } : it))
    );
  };

  // Acción rápida: Marcar funcionales pendientes como No probado (Sin encendido)
  const handleMarcarFuncionalesSinEncendido = () => {
    userEditedRef.current = true;
    setItemsFuncionales(prev =>
      prev.map(it => ({
        ...it,
        estado: 'no_probado',
        observaciones: it.observaciones || 'No probado (Equipo no enciende al recibir)',
      }))
    );
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Encabezado y Aviso de Responsabilidad Legal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PowerIcon className="w-5 h-5 text-brand-500" />
            Inspección Inicial de Recepción
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Documente el estado de entrega en mostrador. Todos los ítems inician en{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">«No revisado»</span> o{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">«No probado»</span>.
          </p>
        </div>

        {/* Acciones Rápidas Compactas */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleMarcarFisicaBueno}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300 hover:bg-green-100 transition-colors"
            title="Asigna 'Buen estado' solo a los componentes físicos que sigan en 'No revisado'"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            Marcar estética en Buen Estado
          </button>
        </div>
      </div>

      {/* 1. Selector de Estado de Encendido al Recibir (4 estados) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2.5">
          1. Estado de Encendido al Recibir el Equipo *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Estado de encendido">
          {opcionesEncendido.map(opt => {
            const isSelected = estadoEncendido === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setEstadoEncendido(opt.value)}
                className={`flex items-center gap-2 p-3 min-h-[44px] rounded-xl border text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? `${opt.activeClass} shadow-sm ring-2 ring-brand-500/30`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sugerencia contextual si no enciende */}
        {estadoEncendido === 'falla' && (
          <div className="mt-3 flex items-center justify-between gap-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>El equipo no enciende. ¿Deseas marcar las pruebas funcionales como «No probado»?</span>
            </div>
            <button
              type="button"
              onClick={handleMarcarFuncionalesSinEncendido}
              className="px-2.5 py-1 font-bold bg-red-600 hover:bg-red-700 text-white rounded text-[11px] whitespace-nowrap transition-colors"
            >
              Aplicar a funcionales
            </button>
          </div>
        )}
      </div>

      {/* 2. Sección: Inspección Física y Estética */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            2. Inspección Física y Estética ({itemsFisicos.length} puntos)
          </h4>
          <span className="text-[11px] text-gray-400 italic">
            Califique cada componente exterior
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          {itemsFisicos.map((itemFis, idx) => (
            <div
              key={idx}
              className="p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              {/* Nombre de componente */}
              <div className="min-w-[160px] md:w-1/4">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {itemFis.item}
                </span>
              </div>

              {/* Controles táctiles compactos (Target size >= 44px) */}
              <div
                className="flex flex-wrap items-center gap-1.5 flex-1"
                role="radiogroup"
                aria-label={`Estado físico de ${itemFis.item}`}
              >
                {opcionesFisicas.map(opt => {
                  const isSelected = itemFis.estado === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateFisico(idx, 'estado', opt.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-2 min-h-[42px] rounded-lg border text-xs transition-all ${
                        isSelected
                          ? `${opt.activeClass} shadow-sm ring-1 ring-brand-500/40`
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      title={opt.label}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[11px]">{opt.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo para observación específica */}
              <div className="w-full md:w-1/4 relative">
                <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemFis.observaciones || ''}
                  onChange={e => updateFisico(idx, 'observaciones', e.target.value)}
                  placeholder="Nota (ej. rayón leve)..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  aria-label={`Observaciones para ${itemFis.item}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sección: Verificación Funcional Rápida */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            3. Verificación Funcional Rápida ({itemsFuncionales.length} pruebas)
          </h4>
          <span className="text-[11px] text-gray-400 italic">
            Pruebe solo lo verificable en mostrador
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          {itemsFuncionales.map((itemFunc, idx) => (
            <div
              key={idx}
              className="p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              {/* Nombre de la prueba */}
              <div className="min-w-[160px] md:w-1/4">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {itemFunc.item}
                </span>
              </div>

              {/* Controles táctiles funcionales */}
              <div
                className="flex flex-wrap items-center gap-1.5 flex-1"
                role="radiogroup"
                aria-label={`Estado funcional de ${itemFunc.item}`}
              >
                {opcionesFuncionales.map(opt => {
                  const isSelected = itemFunc.estado === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateFuncional(idx, 'estado', opt.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-2 min-h-[42px] rounded-lg border text-xs transition-all ${
                        isSelected
                          ? `${opt.activeClass} shadow-sm ring-1 ring-brand-500/40`
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      title={opt.label}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[11px]">{opt.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo para observación específica */}
              <div className="w-full md:w-1/4 relative">
                <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemFunc.observaciones || ''}
                  onChange={e => updateFuncional(idx, 'observaciones', e.target.value)}
                  placeholder="Detalle de prueba..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  aria-label={`Observaciones para ${itemFunc.item}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Observación General de Recepción */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
          Observaciones Generales de Recepción (Opcional)
        </label>
        <textarea
          value={observacionGeneral}
          onChange={e => setObservacionGeneral(e.target.value)}
          placeholder="Añada cualquier antecedente relevante manifestado por el cliente en el mostrador..."
          rows={2}
          className="w-full p-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
