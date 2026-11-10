'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/types/order.types';
import {
  PrinterIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  TicketIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/button/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | any | null;
  orderId?: number;
}

export default function TicketTermicoModal({
  isOpen,
  onClose,
  order: initialOrder,
  orderId,
}: Props) {
  const { data: session } = useSession();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [order, setOrder] = React.useState<Order | any | null>(initialOrder || null);
  const [loadingOrder, setLoadingOrder] = React.useState(!initialOrder && !!orderId);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = React.useState<string | null>(null);

  // Carga el ticket térmico PDF desde el backend
  const loadTicketPdf = React.useCallback(
    async (targetOrderId: number, customToken?: string) => {
      try {
        setPdfLoading(true);
        const tokenAct =
          customToken ||
          (initialOrder as any)?.tokenActivacion ||
          (initialOrder as any)?.activacion?.token ||
          (order as any)?.tokenActivacion ||
          (order as any)?.activacion?.token;

        const headers: Record<string, string> = {
          Authorization: `Bearer ${session?.accessToken}`,
        };
        if (tokenAct) {
          headers['x-token-activacion'] = tokenAct;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${targetOrderId}/documentos/ticket-termico`,
          { headers },
        );

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        console.error('Error cargando ticket térmico:', err);
      } finally {
        setPdfLoading(false);
      }
    },
    [session?.accessToken, initialOrder],
  );

  // Carga inicial
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialOrder?.id) {
      setOrder(initialOrder);
      setLoadingOrder(false);
      const token =
        (initialOrder as any)?.tokenActivacion ||
        (initialOrder as any)?.activacion?.token;
      loadTicketPdf(initialOrder.id, token);
    } else if (orderId) {
      const fetchOrder = async () => {
        try {
          setLoadingOrder(true);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${session?.accessToken}`,
                'Content-Type': 'application/json',
              },
            },
          );
          if (response.ok) {
            const data = await response.json();
            setOrder(data);
            const token = data?.tokenActivacion || data?.activacion?.token;
            loadTicketPdf(orderId, token);
          }
        } catch (error) {
          console.error('Error fetching order for ticket:', error);
        } finally {
          setLoadingOrder(false);
        }
      };
      fetchOrder();
    }
  }, [isOpen, initialOrder, orderId, loadTicketPdf]);

  // Limpiar URL del blob al desmontar
  React.useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Imprimir mediante diálogo nativo del navegador
  const handlePrint = () => {
    if (!pdfBlobUrl) return;

    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      }
    } catch {
      // Fallback a ventana emergente si la política de iframe bloquea print() directo
    }

    const printWin = window.open(pdfBlobUrl, '_blank');
    if (printWin) {
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.warn('Error en printWin.print():', e);
        }
      }, 500);
    }
  };

  // Descargar archivo PDF del ticket
  const handleDownload = () => {
    if (pdfBlobUrl && order) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = `Ticket_ODS_${order.workOrderNumber || order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (loadingOrder) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando ticket...">
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      </Modal>
    );
  }

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-lg p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl"
    >
      {/* Encabezado del Modal */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TicketIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Ticket de Recepción (80 mm)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Orden #{order.workOrderNumber || order.id} · Formato POS térmico continuo
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Cuerpo del Modal: Visor y Mockup de Ticket Térmico */}
      <div className="p-4 sm:p-5 bg-gray-100/70 dark:bg-gray-950/40">
        <div className="flex flex-col items-center">
          {/* Contenedor estilo recibo térmico con proporción de 80 mm */}
          <div className="relative w-full max-w-[310px] rounded-xl bg-white p-2.5 shadow-md border border-gray-300 dark:border-gray-700">
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center h-[420px] text-gray-400 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="text-xs font-medium">Generando ticket de 80 mm...</span>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                ref={iframeRef}
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=Fit`}
                className="w-full h-[430px] rounded-lg border-0 bg-white"
                title={`Ticket térmico ODS #${order.workOrderNumber}`}
              />
            ) : (
              <div className="flex items-center justify-center h-[420px] text-xs text-gray-400">
                No se pudo cargar el ticket.
              </div>
            )}
          </div>

          {/* Nota guía para configuración de impresora térmica POS */}
          <div className="mt-4 flex items-start gap-2 max-w-[340px] rounded-lg bg-emerald-50 p-2.5 text-left text-[11px] leading-relaxed text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
            <InformationCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Tip de impresión POS:</strong> En el cuadro de diálogo del navegador, seleccione su impresora de recibos, papel continuo de <strong>80 mm / 3.14 pulg</strong> y márgenes <strong>"Ninguno"</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto text-xs font-semibold"
        >
          Cerrar
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={!pdfBlobUrl}
            className="flex-1 sm:flex-initial items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Descargar PDF
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            disabled={!pdfBlobUrl}
            className="flex-1 sm:flex-initial items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir Ticket
          </Button>
        </div>
      </div>
    </Modal>
  );
}
