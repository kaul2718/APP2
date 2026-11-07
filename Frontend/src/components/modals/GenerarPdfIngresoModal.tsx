'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/types/order.types';
import {
  PrinterIcon,
  XMarkIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import TabletSignatureModal from './TabletSignatureModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  orderId?: number;
}

export default function GenerarPdfIngresoModal({
  isOpen,
  onClose,
  order: initialOrder,
  orderId,
}: Props) {
  const { data: session } = useSession();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [order, setOrder] = React.useState<Order | null>(initialOrder || null);
  const [loadingOrder, setLoadingOrder] = React.useState(!initialOrder && !!orderId);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = React.useState<string | null>(null);
  const [signedDoc, setSignedDoc] = React.useState<any | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = React.useState(false);

  // Carga documento firmado existente en R2
  const fetchSignedDoc = React.useCallback(
    async (targetOrderId: number) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${targetOrderId}/documentos/tipo/RECEPCION`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );
        if (response.ok) {
          const doc = await response.json();
          setSignedDoc(doc || null);
        }
      } catch (error) {
        console.warn('No se pudo obtener documento firmado de ingreso:', error);
      }
    },
    [session],
  );

  // Carga el PDF oficial desde el backend (R2 o en memoria si aún es borrador)
  const loadPdf = React.useCallback(
    async (targetOrderId: number, customToken?: string) => {
      try {
        setPdfLoading(true);
        const tokenAct =
          customToken ||
          (order as any)?.tokenActivacion ||
          (order as any)?.activacion?.token ||
          (initialOrder as any)?.tokenActivacion ||
          (initialOrder as any)?.activacion?.token;

        const headers: Record<string, string> = {
          Authorization: `Bearer ${session?.accessToken}`,
        };
        if (tokenAct) {
          headers['x-token-activacion'] = tokenAct;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${targetOrderId}/documentos/preview/RECEPCION`,
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
        console.error('Error cargando PDF canónico de R2:', err);
      } finally {
        setPdfLoading(false);
      }
    },
    [session?.accessToken, order, initialOrder],
  );

  // Carga inicial al abrir el modal
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialOrder) {
      setOrder(initialOrder);
      setLoadingOrder(false);
      fetchSignedDoc(initialOrder.id);
      const token =
        (initialOrder as any)?.tokenActivacion ||
        (initialOrder as any)?.activacion?.token;
      loadPdf(initialOrder.id, token);
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
            fetchSignedDoc(orderId);
            loadPdf(orderId);
          }
        } catch (error) {
          console.error('Error fetching order for PDF:', error);
        } finally {
          setLoadingOrder(false);
        }
      };
      fetchOrder();
    }
  }, [isOpen, initialOrder, orderId, session, fetchSignedDoc, loadPdf]);

  // Limpiar URL del blob al desmontar o cerrar
  React.useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Imprimir directamente el PDF canónico de R2
  const handlePrint = () => {
    if (pdfBlobUrl) {
      const printWin = window.open(pdfBlobUrl, '_blank');
      if (printWin) {
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {
            console.warn('Error llamando printWin.print():', e);
          }
        }, 500);
      }
    }
  };

  // Descargar archivo PDF canónico
  const handleDownload = () => {
    if (pdfBlobUrl && order) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = `Comprobante_Ingreso_ODS_${order.workOrderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (signedDoc?.archivoPdfUrl) {
      window.open(signedDoc.archivoPdfUrl, '_blank');
    }
  };

  if (loadingOrder) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando comprobante...">
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
      title={`Comprobante Oficial de Ingreso - ODS #${order.workOrderNumber}`}
      className="max-w-5xl"
    >
      {/* Barra de herramientas superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-3.5 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <DocumentCheckIcon className="h-5 w-5 text-brand-500" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              ODS #{order.workOrderNumber}
            </span>
          </div>
          {signedDoc ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Sellado en R2
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Borrador (Sin Firma)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Firmar en Tablet */}
          {!signedDoc && (
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Firmar en Tablet
            </button>
          )}

          {/* Botón Descargar PDF Canónico */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfBlobUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar PDF
          </button>

          {/* Botón Imprimir Comprobante Oficial */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={!pdfBlobUrl}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir Comprobante
          </button>

          {/* Botón Recargar */}
          <button
            type="button"
            onClick={() => loadPdf(order.id)}
            title="Recargar vista previa"
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${pdfLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Visor Embebido del PDF Real de R2 */}
      <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-b-2xl">
        {pdfLoading ? (
          <div className="flex flex-col items-center justify-center h-[76vh] space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Generando documento oficial de Cloudflare R2...
            </p>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            title={`Comprobante Oficial ODS #${order.workOrderNumber}`}
            className="w-full h-[76vh] rounded-xl border border-gray-200 dark:border-gray-700 bg-white shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[76vh] space-y-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 text-sm">No se pudo cargar la vista previa del documento.</p>
            <button
              onClick={() => loadPdf(order.id)}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      {/* Modal de Firma en Tablet */}
      {order && (
        <TabletSignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          order={order}
          tipoDocumento="RECEPCION"
          onSignedSuccess={(newDoc) => {
            setSignedDoc(newDoc);
            setIsSignModalOpen(false);
            if (order?.id) {
              loadPdf(order.id);
            }
          }}
        />
      )}
    </Modal>
  );
}
