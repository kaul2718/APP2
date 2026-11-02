'use client';

import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import {
  useConfiguracionSistema,
  ConfiguracionSistema,
} from '@/hooks/useConfiguracionSistema';
import {
  HashtagIcon,
  BuildingOffice2Icon,
  ScaleIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export default function ConfiguracionSistemaPage() {
  const {
    configuracion,
    loading,
    saving,
    uploadingLogo,
    error,
    refetch,
    actualizarConfiguracion,
    subirLogo,
  } = useConfiguracionSistema();

  const [activeTab, setActiveTab] = useState<
    'secuenciales' | 'empresa' | 'legales' | 'economicos' | 'plantillas'
  >('secuenciales');

  // Form state
  const [formData, setFormData] = useState<Partial<ConfiguracionSistema>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Sync state when configuracion loads
  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion);
      if (configuracion.logoUrl) {
        setLogoPreview(configuracion.logoUrl);
      }
    }
  }, [configuracion]);

  const handleChange = (
    field: keyof ConfiguracionSistema,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData) return;

    // Validación básica de secuencia
    if (
      formData.ordenSiguienteNumero !== undefined &&
      Number(formData.ordenSiguienteNumero) < 1
    ) {
      toast.error('El siguiente número de orden debe ser mayor o igual a 1');
      return;
    }

    const exito = await actualizarConfiguracion(formData);
    if (exito) {
      refetch();
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5 MB');
        return;
      }
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    const url = await subirLogo(logoFile);
    if (url) {
      setLogoFile(null);
      setLogoPreview(url);
    }
  };

  // Cálculo en vivo de la vista previa del número de orden
  const previewOrden = (() => {
    const prefijo = formData.ordenPrefijo || '';
    const num = Number(formData.ordenSiguienteNumero) || 1;
    const digitos = Math.max(3, Math.min(10, Number(formData.ordenDigitos) || 5));
    return `${prefijo}${String(num).padStart(digitos, '0')}`;
  })();

  const previewPresupuesto = (() => {
    const prefijo = formData.presupuestoPrefijo || 'PRE-';
    const num = Number(formData.presupuestoSiguienteNumero) || 1;
    const digitos = Math.max(3, Math.min(10, Number(formData.presupuestoDigitos) || 5));
    return `${prefijo}${String(num).padStart(digitos, '0')}`;
  })();

  if (loading && !configuracion) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="w-10 h-10 text-brand-500 animate-spin mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
          Cargando configuración del sistema...
        </p>
      </div>
    );
  }

  const tabs = [
    {
      id: 'secuenciales',
      name: 'Numeración y Secuenciales',
      icon: HashtagIcon,
      badge: 'Requerido',
    },
    {
      id: 'empresa',
      name: 'Datos del Taller y Logo',
      icon: BuildingOffice2Icon,
    },
    {
      id: 'legales',
      name: 'Políticas y Términos PDF',
      icon: ScaleIcon,
    },
    {
      id: 'economicos',
      name: 'Parámetros Financieros & SLAs',
      icon: CurrencyDollarIcon,
    },
    {
      id: 'plantillas',
      name: 'Plantillas de WhatsApp',
      icon: ChatBubbleLeftRightIcon,
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageBreadcrumb pageTitle="Configuración del Sistema" />
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-sm shadow-brand-500/20 disabled:opacity-50"
        >
          {saving ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
          Guardar Cambios
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-700 dark:text-error-300 text-sm flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-2 shadow-sm">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Secuenciales y Folios de Órdenes */}
      {activeTab === 'secuenciales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                  <HashtagIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Correlativo de Órdenes de Servicio (ODS)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Define desde qué número empiezan las órdenes y su formato visual.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Prefijo Opcional
                  </label>
                  <input
                    type="text"
                    value={formData.ordenPrefijo ?? ''}
                    onChange={(e) => handleChange('ordenPrefijo', e.target.value)}
                    placeholder="Ej: ODS- o HDC-"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Déjalo vacío si solo deseas números (ej: 00036).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Siguiente Número a Emitir
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ordenSiguienteNumero ?? 1}
                    onChange={(e) =>
                      handleChange('ordenSiguienteNumero', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Número que recibirá la próxima orden creada.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Longitud de Dígitos (Ceros)
                  </label>
                  <select
                    value={formData.ordenDigitos ?? 5}
                    onChange={(e) =>
                      handleChange('ordenDigitos', parseInt(e.target.value, 10) || 5)
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  >
                    <option value={4}>4 dígitos (ej: 0001)</option>
                    <option value={5}>5 dígitos (ej: 00001) [Predeterminado]</option>
                    <option value={6}>6 dígitos (ej: 000001)</option>
                    <option value={7}>7 dígitos (ej: 0000001)</option>
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Relleno automático con ceros a la izquierda.
                  </span>
                </div>
              </div>

              {/* Checkbox de seguridad */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ordenPermitirReinicio ?? false}
                    onChange={(e) => handleChange('ordenPermitirReinicio', e.target.checked)}
                    className="mt-1 w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-400"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      Permitir modificación forzada del correlativo
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Habilita esta opción solo si necesitas reiniciar la secuencia o establecer
                      un número menor al mayor emitido históricamente.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Secuencial de Presupuestos */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Correlativo de Presupuestos Técnicos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Prefijo Presupuesto
                  </label>
                  <input
                    type="text"
                    value={formData.presupuestoPrefijo ?? 'PRE-'}
                    onChange={(e) => handleChange('presupuestoPrefijo', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Siguiente Presupuesto
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.presupuestoSiguienteNumero ?? 1}
                    onChange={(e) =>
                      handleChange('presupuestoSiguienteNumero', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Longitud Dígitos
                  </label>
                  <select
                    value={formData.presupuestoDigitos ?? 5}
                    onChange={(e) =>
                      handleChange('presupuestoDigitos', parseInt(e.target.value, 10) || 5)
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  >
                    <option value={4}>4 dígitos</option>
                    <option value={5}>5 dígitos</option>
                    <option value={6}>6 dígitos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Vista Previa Lateral */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-slate-900 text-white shadow-lg space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-400 flex items-center gap-1.5">
                  <EyeIcon className="w-4 h-4" />
                  Vista Previa en Vivo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-gray-300 font-mono">
                  Siguiente Orden
                </span>
              </div>

              <div className="py-4 text-center border-y border-white/10">
                <p className="text-xs text-gray-400 mb-1">Número generado al guardar:</p>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-blue-300 tracking-wider">
                  #{previewOrden}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckIcon className="w-3.5 h-3.5" />
                  Garantía de correlatividad atómica
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Presupuesto Siguiente:</span>
                  <span className="font-mono text-white font-semibold">#{previewPresupuesto}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taller:</span>
                  <span className="text-white">{formData.nombreComercial || 'Hospital del Computador'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-300 leading-relaxed flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>
                  El sistema utiliza bloqueo transaccional en PostgreSQL (Pessimistic Write Lock). Aunque varios recepcionistas registren órdenes al mismo tiempo, jamás se generará un duplicado.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Datos del Taller y Logo */}
      {activeTab === 'empresa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2.5 rounded-xl bg-theme-purple-50 dark:bg-theme-purple-500/10 text-theme-purple-500">
                  <BuildingOffice2Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Membrete e Identidad del Taller
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Esta información se plasma automáticamente en los comprobantes PDF de ingreso y entrega.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={formData.nombreEmpresa ?? ''}
                    onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={formData.nombreComercial ?? ''}
                    onChange={(e) => handleChange('nombreComercial', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    RUC (Ecuador - 13 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={formData.ruc ?? ''}
                    onChange={(e) => handleChange('ruc', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Oficial de Soporte
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-500">
                      <PhoneIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formData.whatsapp ?? '+593 96 962 0222'}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono Convencional
                  </label>
                  <input
                    type="text"
                    value={formData.telefono ?? ''}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Correo Oficial de Contacto
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <EnvelopeIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={formData.correoContacto ?? ''}
                      onChange={(e) => handleChange('correoContacto', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Dirección Física del Taller Matriz
                  </label>
                  <div className="relative">
                    <span className="absolute top-3 left-3 text-gray-400">
                      <MapPinIcon className="w-4 h-4" />
                    </span>
                    <textarea
                      rows={2}
                      value={formData.direccion ?? ''}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad ?? 'Quito'}
                    onChange={(e) => handleChange('ciudad', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Slogan / Subtítulo del Taller
                  </label>
                  <input
                    type="text"
                    value={formData.slogan ?? ''}
                    onChange={(e) => handleChange('slogan', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subida y Previsualización de Logo */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-brand-500" />
                Logo Corporativo para PDFs
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Formatos: SVG, PNG, JPG, WEBP (máx. 5 MB). Se estampará en la esquina superior izquierda de todas las órdenes y actas.
              </p>

              <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-center min-h-[160px]">
                {logoPreview ? (
                  <div className="space-y-3">
                    <img
                      src={logoPreview}
                      alt="Logo Empresa"
                      className="max-h-24 max-w-[200px] object-contain mx-auto rounded shadow-sm"
                    />
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Logo cargado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500">Ningún logo cargado</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  id="logo-upload-input"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload-input"
                  className="w-full block text-center px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  Seleccionar nueva imagen
                </label>

                {logoFile && (
                  <button
                    onClick={handleUploadLogo}
                    disabled={uploadingLogo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    Confirmar y Subir a Cloudflare R2
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Políticas y Términos PDF */}
      {activeTab === 'legales' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Políticas Legales, Garantías y Condiciones de Taller
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cláusulas de custodia y entrega respaldadas en el marco legal ecuatoriano.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Días para Declaración de Abandono (Código Civil EC)
              </label>
              <input
                type="number"
                min="1"
                value={formData.diasAbandono ?? 60}
                onChange={(e) =>
                  handleChange('diasAbandono', parseInt(e.target.value, 10) || 60)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Plazo reglamentario tras el cual un equipo no retirado causará bodegaje o remate.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Días de Garantía por Defecto en Reparaciones
              </label>
              <input
                type="number"
                min="0"
                value={formData.diasGarantiaDefault ?? 90}
                onChange={(e) =>
                  handleChange('diasGarantiaDefault', parseInt(e.target.value, 10) || 90)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Garantía estándar aplicable sobre mano de obra técnica (ej: 90 días).
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Términos y Condiciones al Recibir el Equipo (Comprobante de Ingreso)
              </label>
              <textarea
                rows={4}
                value={formData.terminosRecepcion ?? ''}
                onChange={(e) => handleChange('terminosRecepcion', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Declaración de Conformidad y Garantía al Retirar (Acta de Entrega)
              </label>
              <textarea
                rows={4}
                value={formData.terminosEntrega ?? ''}
                onChange={(e) => handleChange('terminosEntrega', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Parámetros Económicos & SLAs */}
      {activeTab === 'economicos' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Parámetros Financieros, Fiscales y Alertas de Taller
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Impuestos aplicables y umbrales de tiempo para la gestión operativa del taller.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Porcentaje de IVA Vigente (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.porcentajeIva ?? 15.0}
                  onChange={(e) =>
                    handleChange('porcentajeIva', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-gray-400">
                  %
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Actualmente en Ecuador: 15% (Ley para el Fortalecimiento Fiscal).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Vigencia de Presupuestos (Días)
              </label>
              <input
                type="number"
                min="1"
                value={formData.diasVigenciaPresupuesto ?? 15}
                onChange={(e) =>
                  handleChange('diasVigenciaPresupuesto', parseInt(e.target.value, 10) || 15)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Tiempo de validez de cotizaciones antes de considerarse vencidas.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Límite para Diagnóstico (Horas)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <ClockIcon className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  min="1"
                  value={formData.tiempoLimiteDiagnosticoHoras ?? 48}
                  onChange={(e) =>
                    handleChange('tiempoLimiteDiagnosticoHoras', parseInt(e.target.value, 10) || 48)
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Tras este tiempo, la orden se marcará como alerta de diagnóstico atrasado.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Alerta de Retiro en "Control" (Días)
              </label>
              <input
                type="number"
                min="1"
                value={formData.diasAlertaControlRetiro ?? 15}
                onChange={(e) =>
                  handleChange('diasAlertaControlRetiro', parseInt(e.target.value, 10) || 15)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Días máximos que un equipo reparado espera al cliente antes de alertar.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Umbral de Stock Mínimo Global
              </label>
              <input
                type="number"
                min="0"
                value={formData.stockMinimoAlertaGlobal ?? 5}
                onChange={(e) =>
                  handleChange('stockMinimoAlertaGlobal', parseInt(e.target.value, 10) || 5)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Genera advertencia en inventario cuando un repuesto baje de esta cantidad.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Plantillas de WhatsApp */}
      {activeTab === 'plantillas' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Plantillas para Notificaciones de WhatsApp
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Personaliza los mensajes directos que se envían a los clientes al WhatsApp registrado.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              Variables dinámicas disponibles para usar en tus mensajes:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['{cliente}', '{orden}', '{equipo}', '{enlace_consulta}'].map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 font-mono text-brand-600 dark:text-brand-400 font-semibold text-[11px]"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Mensaje de Recepción (Equipo ingresado al taller)
              </label>
              <textarea
                rows={3}
                value={formData.plantillaWhatsappRecepcion ?? ''}
                onChange={(e) => handleChange('plantillaWhatsappRecepcion', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Mensaje de Retiro (Equipo reparado y listo en "Control")
              </label>
              <textarea
                rows={3}
                value={formData.plantillaWhatsappListoEntrega ?? ''}
                onChange={(e) =>
                  handleChange('plantillaWhatsappListoEntrega', e.target.value)
                }
                className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
