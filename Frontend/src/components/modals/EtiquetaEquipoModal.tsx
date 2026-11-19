'use client';

import React from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import {
  PrinterIcon,
  XMarkIcon,
  TagIcon,
  InformationCircleIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import {
  buildEquipmentLabelData,
  buildEquipmentLabelPrintHtml,
  EquipmentLabelData,
} from '@/lib/etiquetaEquipo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  mode?: 'print' | 'reprint';
}

function LabelPreviewCard({
  data,
  qrDataUrl,
  scale = 1,
}: {
  data: EquipmentLabelData;
  qrDataUrl: string | null;
  scale?: 1 | 2;
}) {
  const isZoomed = scale === 2;
  return (
    <div
      className="mx-auto overflow-hidden rounded border border-gray-300 bg-white text-black shadow-sm"
      style={{
        width: isZoomed ? '101.6mm' : '50.8mm',
        height: isZoomed ? '50.8mm' : '25.4mm',
      }}
    >
      <div
        className="flex flex-col justify-between bg-white text-black"
        style={{
          width: '50.8mm',
          height: '25.4mm',
          padding: '1.5mm 2mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
          transform: isZoomed ? 'scale(2)' : 'none',
          transformOrigin: 'top left',
        }}
      >
        <div
          className="flex items-center justify-between gap-1 border-b border-black"
          style={{ paddingBottom: '0.7mm' }}
        >
          <div className="flex min-w-0 items-center gap-1">
            <img
              src="/images/logo/logo-icon.svg"
              alt="HDC"
              className="block shrink-0 object-contain"
              style={{
                width: '3.4mm',
                height: '3.4mm',
                filter: 'grayscale(100%) contrast(180%)',
              }}
            />
            <span
              className="whitespace-nowrap font-bold uppercase leading-none"
              style={{ fontSize: '6.2pt', letterSpacing: '0.03em' }}
            >
              HDC Taller
            </span>
          </div>
          <span
            className="whitespace-nowrap font-bold uppercase leading-none"
            style={{ fontSize: '5.5pt', letterSpacing: '0.04em' }}
          >
            ID Equipo
          </span>
        </div>

        <div
          className="flex flex-row items-center justify-between"
          style={{ gap: '1.5mm', padding: '0.3mm 0' }}
        >
          <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: '0.6mm' }}>
            <div
              className="truncate font-extrabold uppercase leading-tight"
              style={{ fontSize: '11.8pt', letterSpacing: '0.02em' }}
            >
              {data.workOrderNumber}
            </div>
            <div className="truncate font-bold leading-tight" style={{ fontSize: '7.3pt' }}>
              {data.equipmentLine}
            </div>
          </div>
          {qrDataUrl && (
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: '11.4mm', height: '11.4mm' }}
            >
              <img
                src={qrDataUrl}
                alt={`QR ${data.workOrderNumber}`}
                className="block"
                style={{
                  width: '11.4mm',
                  height: '11.4mm',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          )}
        </div>

        <div
          className="flex items-baseline justify-between border-t border-black"
          style={{ paddingTop: '0.7mm', gap: '1.2mm' }}
        >
          <span className="min-w-0 flex-1 truncate font-semibold leading-tight" style={{ fontSize: '7.2pt' }}>
            {data.clientName}
          </span>
          <span
            className="shrink-0 whitespace-nowrap font-bold leading-tight tabular-nums"
            style={{ fontSize: '7.2pt' }}
          >
            {data.phone}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EtiquetaEquipoModal({
  isOpen,
  onClose,
  order,
  mode = 'print',
}: Props) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = React.useState<1 | 2>(2);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);

  const labelData = React.useMemo(() => {
    return order ? buildEquipmentLabelData(order) : null;
  }, [order]);

  React.useEffect(() => {
    if (!isOpen || !labelData?.orderUrl) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(labelData.orderUrl, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, labelData?.orderUrl]);

  if (!order || !labelData) return null;

  const handlePrint = async () => {
    const iframe = iframeRef.current;
    if (!iframe || isPrinting) return;

    setIsPrinting(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const logoSrc = `${origin}/images/logo/logo-icon.svg`;
      const html = buildEquipmentLabelPrintHtml(labelData, logoSrc, qrDataUrl);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      doc.open();
      doc.write(html);
      doc.close();

      // Esperar carga completa del SVG y fuentes del iframe antes de lanzar impresión
      await new Promise<void>((resolve) => {
        const imgs = Array.from(doc.querySelectorAll('img'));
        if (imgs.length === 0 || imgs.every((img) => img.complete)) {
          setTimeout(resolve, 60);
          return;
        }
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          setTimeout(resolve, 40);
        };
        const timer = setTimeout(done, 1200);
        let remaining = imgs.length;
        const onOne = () => {
          remaining -= 1;
          if (remaining <= 0) {
            clearTimeout(timer);
            done();
          }
        };
        imgs.forEach((img) => {
          if (img.complete) {
            onOne();
          } else {
            img.addEventListener('load', onOne, { once: true });
            img.addEventListener('error', onOne, { once: true });
          }
        });
      });

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg overflow-hidden p-0">
      <div className="flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {mode === 'reprint'
                  ? 'Reimprimir Etiqueta de Equipo (2" × 1")'
                  : 'Etiqueta Adhesiva de Equipo (2" × 1")'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sticker térmico 50.8 mm × 25.4 mm · {labelData.workOrderNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Cerrar modal de etiqueta"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Vista previa */}
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vista previa ({previewScale === 2 ? 'Ampliada 2×' : 'Escala real aprox. 1:1'})
            </span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setPreviewScale(2)}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  previewScale === 2
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                <MagnifyingGlassPlusIcon className="h-3.5 w-3.5" />
                2× Lectura
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale(1)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  previewScale === 1
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                1:1 (50.8×25.4 mm)
              </button>
            </div>
          </div>

          <div className="flex min-h-[210px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-100/80 p-5 dark:border-gray-700 dark:bg-gray-950/60">
            <LabelPreviewCard data={labelData} qrDataUrl={qrDataUrl} scale={previewScale} />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
            <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              En el diálogo de impresión, selecciona la impresora de etiquetas <strong>2&quot; × 1&quot; (50.8 × 25.4 mm)</strong> con márgenes en <strong>Ninguno</strong> y sin encabezados/pies de página.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            <PrinterIcon className="h-4 w-4" />
            <span>
              {isPrinting
                ? 'Preparando...'
                : mode === 'reprint'
                  ? 'Reimprimir Etiqueta'
                  : 'Imprimir Etiqueta'}
            </span>
          </Button>
        </div>

        {/* Iframe oculto aislado para impresión */}
        <iframe
          ref={iframeRef}
          title="Impresión de etiqueta adhesiva"
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-0 w-0 border-0 opacity-0"
        />
      </div>
    </Modal>
  );
}

