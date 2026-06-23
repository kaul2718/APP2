'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/types/order.types';
import { PrinterIcon, XMarkIcon, MapPinIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { useSession } from 'next-auth/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  orderId?: number;
}

export default function GenerarPdfIngresoModal({ isOpen, onClose, order: initialOrder, orderId }: Props) {
  const { data: session } = useSession();
  const componentRef = React.useRef<HTMLDivElement>(null);
  const [order, setOrder] = React.useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = React.useState(!initialOrder && !!orderId);

  React.useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setLoading(false);
    } else if (orderId) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${orderId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setOrder(data);
          }
        } catch (error) {
          console.error("Error fetching order for PDF:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [initialOrder, orderId, session]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: order ? `Comprobante_Ingreso_ODS_${order.workOrderNumber}` : 'Comprobante_Ingreso',
    pageStyle: `
      @page {
        size: auto;
        margin: 0mm !important;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .printable-area {
          margin: 10mm !important;
        }
      }
    `,
  });

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando comprobante...">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      </Modal>
    );
  }

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprobante de Ingreso - ODS #${order.workOrderNumber}`}
      className="max-w-4xl print:hidden"
    >
      {/* Estilos locales para el documento impreso */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm; /* Margen estándar de impresora */
          }
          body {
            -webkit-print-color-adjust: exact;
            background-color: white !important;
          }
        }
      `}</style>

      {/* Barra de herramientas superior (Oculta al imprimir) */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl print:hidden">
        <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <PrinterIcon className="h-5 w-5 text-brand-500" aria-hidden="true" />
          Vista Previa - Comprobante de Ingreso
        </p>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <PrinterIcon className="h-4 w-4" aria-hidden="true" />
            Imprimir Comprobante
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Contenedor del documento imprimible */}
      <div ref={componentRef} className="p-8 space-y-6 bg-white text-gray-900 dark:bg-white dark:text-gray-900 max-h-[calc(100vh-13rem)] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 printable-area">

        {/* Encabezado Alineado a la Izquierda */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
          <div className="space-y-4">
            <div className="relative w-64 h-24">
              <Image
                src="/images/logo/logo.svg"
                alt="Logo Hospital del Computador"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            
            <div className="space-y-1 text-xs font-bold text-gray-600 uppercase">
              <p className="flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-brand-500" aria-hidden="true" />
                Veloz, entre diego de ibarra y uruguay
              </p>
              <p className="flex items-center gap-1.5">
                <PhoneIcon className="w-4 h-4 text-brand-500" aria-hidden="true" />
                0959081140 - 0999959595
              </p>
              <p className="flex items-center gap-1.5">
                <GlobeAltIcon className="w-4 h-4 text-brand-500" aria-hidden="true" />
                WWW.HOSPITALCOMPUTADOR.COM
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="border-2 border-gray-900 px-6 py-2 rounded-xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-600">Orden de Servicio</p>
              <p className="text-3xl font-black text-gray-900">#{order.workOrderNumber}</p>
            </div>
            <div className="mt-3 text-xs font-black text-gray-700 uppercase text-right space-y-0.5">
              <p>Fecha: {new Date(order.createdAt).toLocaleString('es-ES')}</p>
              <p>Tipo: {order.tipoOrden}</p>
            </div>
          </div>
        </div>

        {/* Cuerpo del Documento */}
        <div className="grid grid-cols-2 gap-4">
          {/* Columna 1: Cliente y Recepción */}
          <div className="space-y-4">
            <section className="border border-gray-200 rounded-xl p-4 print:border-gray-400">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2 border-b border-gray-200 pb-1">Datos del Cliente</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-bold">Nombre:</span> {order.client?.nombre} {order.client?.apellido}</p>
                <p><span className="font-bold">Cédula/RUC:</span> {(order.client as any)?.cedula || 'N/D'}</p>
                <p><span className="font-bold">Teléfono:</span> {(order.client as any)?.telefono || 'N/D'}</p>
              </div>
            </section>

            <section className="border border-gray-200 rounded-xl p-4 print:border-gray-400">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2 border-b border-gray-200 pb-1">Información de Recepción</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-bold">Receptado por:</span> Recepción General</p>
                <p><span className="font-bold">Técnico Asignado:</span> {order.technician?.nombre || 'Pendiente'}</p>
                <p><span className="font-bold text-brand-600">Fecha Prometida:</span> {order.fechaPrometidaEntrega ? new Date(order.fechaPrometidaEntrega).toLocaleString() : 'Por definir'}</p>
              </div>
            </section>
          </div>

          {/* Columna 2: Equipo */}
          <div className="space-y-4">
            <section className="border border-gray-200 rounded-xl p-4 print:border-gray-400 bg-gray-50/30">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2 border-b border-gray-200 pb-1">Datos del Equipo</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-bold">Tipo:</span> {order.equipo?.tipoEquipo?.nombre}</p>
                <p><span className="font-bold">Marca/Modelo:</span> {order.equipo?.marca?.nombre} {order.equipo?.modelo?.nombre}</p>
                <p><span className="font-bold">Serie:</span> {order.equipo?.numeroSerie}</p>
              </div>
            </section>

            <section className="border border-gray-200 rounded-xl p-4 print:border-gray-400">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2 border-b border-gray-200 pb-1">Accesorios Entregados</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {order.accesorios && order.accesorios.length > 0 ? (
                  order.accesorios.map((acc, i) => (
                    <span key={i} className="text-xs font-bold border border-gray-300 px-2 py-0.5 rounded uppercase">{acc}</span>
                  ))
                ) : (
                  <p className="text-xs italic text-gray-500">Ninguno</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Problema Reportado */}
        <section className="border-2 border-gray-900 rounded-xl p-4 bg-gray-50/50">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Problema Reportado por el Cliente</h3>
          <p className="text-sm font-medium italic leading-relaxed text-gray-800">
            "{order.problemaReportado}"
          </p>
        </section>

        {/* Peritaje Técnico (Solo si existe) */}
        {order.checklistData?.results && order.checklistData.results.length > 0 && (
          <section className="border border-gray-200 rounded-xl p-4 print:border-gray-400">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-3 border-b border-gray-200 pb-1">Peritaje Técnico de Ingreso</h3>
            <div className="grid grid-cols-1 gap-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-1">Punto de Revisión</th>
                    <th className="pb-1">Funcionamiento</th>
                    <th className="pb-1">Estado Físico</th>
                    <th className="pb-1">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.checklistData.results.map((res: any, i: number) => (
                    <tr key={i} className="py-1">
                      <td className="py-1 font-bold">{res.item}</td>
                      <td className="py-1 uppercase font-medium">{res.funcional.replace('_', ' ')}</td>
                      <td className="py-1 uppercase font-medium">{res.estetica}</td>
                      <td className="py-1 italic text-gray-600">{res.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Términos y Condiciones */}
        <section className="text-xs leading-tight space-y-1 border-t pt-4 text-left">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">TÉRMINOS Y CONDICIONES DE RECEPCIÓN:</h3>
          <p className="text-gray-700">1. El Hospital del Computador no se responsabiliza por la pérdida de información contenida en los dispositivos de almacenamiento. Se recomienda al cliente realizar un respaldo previo.</p>
          <p className="text-gray-700">2. Equipos no retirados después de 60 días de la fecha de aviso de entrega serán considerados en abandono y pasarán a propiedad de la empresa para cubrir costos de almacenamiento y repuestos.</p>
          <p className="text-gray-700">3. El diagnóstico inicial es presuntivo y puede variar tras la apertura y revisión profunda del equipo.</p>
        </section>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-20 pt-12">
          <div className="text-center border-t border-gray-400 pt-2">
            <p className="text-xs font-black uppercase">Firma del Cliente</p>
            <p className="text-xs text-gray-600">CC: {(order.client as any)?.cedula || '________________'}</p>
          </div>
          <div className="text-center border-t border-gray-400 pt-2">
            <p className="text-xs font-black uppercase">Recibido por (HC)</p>
            <p className="text-xs text-gray-600">Hospital del Computador</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 uppercase tracking-widest pt-4">
          Comprobante generado por el Sistema de Gestión ODS - Hospital del Computador
        </div>

      </div>

      <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
