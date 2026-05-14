'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/types/order.types';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function GenerarPdfEntregaModal({ isOpen, onClose, order }: Props) {
  if (!order) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Acta_Entrega_ODS_${order.workOrderNumber}`;
    window.print();
    document.title = originalTitle;
  };

  // Calcular total del presupuesto si existe
  const presupuestoItems = order.presupuesto?.detallesPresupuestoItems || [];
  const manoObraItems = order.presupuesto?.detallesManoObra || [];

  const totalItems = presupuestoItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const totalManoObra = manoObraItems.reduce((sum, item) => sum + Number(item.costoTotal), 0);
  const totalPresupuesto = totalItems + totalManoObra;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generar Acta de Entrega - ODS #${order.workOrderNumber}`}
      className="max-w-4xl print:max-w-full print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:text-black"
    >
      {/* Barra de herramientas superior (Oculta al imprimir) */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl print:hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <PrinterIcon className="h-5 w-5 text-brand-500" />
          Vista Previa - Acta de Entrega y Garantía
        </h2>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors focus:ring-2 focus:ring-blue-500"
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenedor del documento imprimible */}
      <div className="p-8 space-y-8 bg-white text-gray-900 dark:bg-white dark:text-gray-900 max-h-[calc(100vh-13rem)] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:space-y-6">
        
        {/* Encabezado del documento */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
              Centro de Servicio Técnico
            </h1>
            <p className="text-sm text-gray-600 mt-1">Acta de Entrega de Equipo y Conformidad de Servicio</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-gray-900 text-white font-bold text-lg px-4 py-1.5 rounded-md tracking-wider">
              ODS #{order.workOrderNumber}
            </span>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Fecha de Emisión: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Sección 1: Datos Generales */}
        <div className="grid grid-cols-2 gap-6">
          {/* Datos del Cliente */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 print:border-gray-400 print:bg-transparent">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 border-b pb-2">
              Datos del Cliente
            </h3>
            <div className="space-y-1.5 text-sm">
              <p><span className="font-semibold text-gray-700">Nombre:</span> {order.client?.nombre} {order.client?.apellido}</p>
              <p><span className="font-semibold text-gray-700">Rol / Tipo:</span> Cliente</p>
              <p><span className="font-semibold text-gray-700">Orden Creada:</span> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/D'}</p>
            </div>
          </div>

          {/* Datos del Equipo */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 print:border-gray-400 print:bg-transparent">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 border-b pb-2">
              Especificaciones del Equipo
            </h3>
            <div className="space-y-1.5 text-sm">
              <p><span className="font-semibold text-gray-700">Marca:</span> {order.equipo?.marca?.nombre || 'N/D'}</p>
              <p><span className="font-semibold text-gray-700">Modelo:</span> {order.equipo?.modelo?.nombre || 'N/D'}</p>
              <p><span className="font-semibold text-gray-700">N° de Serie:</span> <span className="font-mono">{order.equipo?.numeroSerie || 'Sin número de serie'}</span></p>
            </div>
          </div>
        </div>

        {/* Problema Reportado Original */}
        <div className="border border-gray-200 p-5 rounded-xl print:border-gray-400">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Problema Reportado en Recepción
          </h3>
          <p className="text-sm italic text-gray-800">
            "{order.problemaReportado}"
          </p>
        </div>

        {/* Sección 2: Trabajos Realizados (Bitácora Técnica) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Trabajos y Actividades Realizadas
          </h3>
          {order.actividades && order.actividades.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden print:border-gray-400">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold print:bg-gray-200">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Diagnóstico / Trabajo Realizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.actividades.map((act) => (
                    <tr key={act.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                      <td className="p-3 whitespace-nowrap text-xs text-gray-600 font-medium">
                        {new Date(act.fecha).toLocaleDateString()}
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs font-semibold text-brand-600">
                        {act.tipoActividad?.nombre || 'Técnico'}
                      </td>
                      <td className="p-3 text-gray-800">
                        <p className="font-medium">{act.trabajoRealizado}</p>
                        {act.diagnostico && <p className="text-xs text-gray-500 italic mt-0.5">Diagnóstico: {act.diagnostico}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg">
              No se registraron bitácoras técnicas para esta orden.
            </p>
          )}
        </div>

        {/* Sección 3: Detalle de Costos y Presupuesto */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Detalle de Costos y Presupuesto
          </h3>
          {(presupuestoItems.length > 0 || manoObraItems.length > 0) ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden print:border-gray-400">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold print:bg-gray-200">
                  <tr>
                    <th className="p-3">Ítem / Concepto</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">P. Unitario</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Mano de Obra */}
                  {manoObraItems.map((item: any) => (
                    <tr key={`mo-${item.id}`}>
                      <td className="p-3 text-gray-800 font-medium">
                        {item.tipoManoObra?.nombre || 'Mano de Obra'}
                        <span className="text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 ml-2 px-2 py-0.5 rounded">Mano de obra</span>
                      </td>
                      <td className="p-3 text-center text-gray-600">{item.cantidad}</td>
                      <td className="p-3 text-right text-gray-600">${Number(item.costoUnitario).toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-gray-900">${Number(item.costoTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Repuestos */}
                  {presupuestoItems.map((item: any) => (
                    <tr key={`item-${item.id}`}>
                      <td className="p-3 text-gray-800 font-medium">
                        {item.parte?.nombre || 'Ítem de repuesto'}
                        {item.parte?.codigoInterno && <span className="text-xs text-gray-500 ml-1">({item.parte.codigoInterno})</span>}
                        <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ml-2 px-2 py-0.5 rounded">Repuesto</span>
                      </td>
                      <td className="p-3 text-center text-gray-600">{item.cantidad}</td>
                      <td className="p-3 text-right text-gray-600">${Number(item.precioUnitario).toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-gray-900">${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Total */}
                  <tr className="bg-gray-50 print:bg-gray-100 font-bold text-gray-900 text-base border-t-2 border-gray-300">
                    <td colSpan={3} className="p-4 text-right uppercase tracking-wider text-xs font-extrabold text-gray-700">
                      Total a Pagar:
                    </td>
                    <td className="p-4 text-right text-brand-700">
                      ${totalPresupuesto.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg">
              Esta orden no tiene ítems de presupuesto registrados o se realizó sin costo.
            </p>
          )}
        </div>

        {/* Sección 4: Términos, Conformidad y Firma */}
        <div className="pt-8 border-t-2 border-gray-900 space-y-12">
          <div className="text-xs text-gray-600 space-y-2 text-justify">
            <p className="font-bold uppercase text-gray-800">Conformidad del Servicio y Garantía:</p>
            <p>
              El cliente declara haber recibido el equipo especificado en el presente documento a su entera conformidad,
              habiendo verificado su correcto funcionamiento tras la realización del servicio técnico. Toda reparación cuenta
              con una garantía limitada según los términos establecidos por la empresa a partir de la fecha de entrega.
              Esta garantía no cubre daños por mal uso, golpes, humedad o intervención de terceros.
            </p>
          </div>

          {/* Bloque de Firmas */}
          <div className="grid grid-cols-2 gap-12 pt-8">
            <div className="text-center space-y-2">
              <div className="border-t-2 border-gray-400 w-4/5 mx-auto pt-2"></div>
              <p className="font-bold text-sm text-gray-800">Firma del Cliente</p>
              <p className="text-xs text-gray-500">Aclaración y DNI / Cédula</p>
            </div>
            <div className="text-center space-y-2">
              <div className="border-t-2 border-gray-400 w-4/5 mx-auto pt-2"></div>
              <p className="font-bold text-sm text-gray-800">Entregado por (Centro de Servicio)</p>
              <p className="text-xs text-gray-500">Sello / Firma del Responsable</p>
            </div>
          </div>
        </div>

        {/* Pie de página de impresión */}
        <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200 print:block">
          Centro de Servicio Técnico - Sistema de Gestión de Órdenes ODS
        </div>

      </div>

      {/* Pie del modal normal (Oculto al imprimir) */}
      <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
        >
          Cerrar Vista Previa
        </button>
      </div>
    </Modal>
  );
}
