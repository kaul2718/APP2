'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import {
  ChevronLeftIcon,
  PlusIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useCompra, Compra } from "@/hooks/useCompra";

export default function ComprasPage() {
  const router = useRouter();
  const { compras, loading, total, fetchCompras, obtenerCompra, anularCompra } = useCompra();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompraId, setSelectedCompraId] = useState<number | null>(null);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  // Initial load
  useEffect(() => {
    fetchCompras(currentPage, 10, searchTerm);
  }, [currentPage, searchTerm, fetchCompras]);

  // Debounced search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Load single purchase detail
  const handleViewDetail = async (id: number) => {
    setSelectedCompraId(id);
    setDetailLoading(true);
    try {
      const data = await obtenerCompra(id);
      setSelectedCompra(data);
    } catch (err) {
      toast.error("Error al cargar detalles de la compra.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Void/Cancel a purchase
  const handleVoidPurchase = async () => {
    if (!selectedCompra) return;
    if (confirm(`¿Estás completamente seguro de ANULAR la factura de compra #${selectedCompra.numeroFactura}? Esto descontará los productos agregados al stock del catálogo.`)) {
      setIsVoiding(true);
      try {
        const res = await anularCompra(selectedCompra.id);
        if (res) {
          toast.success("Factura de compra anulada con éxito.");
          setSelectedCompra(res); // update modal state
          fetchCompras(currentPage, 10, searchTerm); // reload grid
        }
      } catch (err: any) {
        toast.error(err.message || "Error al anular compra.");
      } finally {
        setIsVoiding(false);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/items")}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <PageBreadcrumb pageTitle="Compras de Almacén" />
      </div>

      {/* Action panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Buscar por nº de factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-brand-500 focus:bg-white transition-all text-sm outline-none dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:focus:bg-gray-900 dark:text-white"
          />
          <MagnifyingGlassIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/items/compras/proveedores")}
            className="flex items-center gap-2 px-5 bg-gray-100 hover:bg-gray-250 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border-none h-11 text-xs font-bold"
          >
            <TruckIcon className="w-4 h-4" />
            <span>Proveedores</span>
          </Button>

          <Button
            onClick={() => router.push("/items/compras/nueva")}
            className="flex items-center gap-2 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none h-11 text-xs font-bold"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Nueva Compra</span>
          </Button>
        </div>
      </div>

      {/* Purchase List Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <svg className="w-10 h-10 animate-spin text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium">Cargando historial de compras...</span>
          </div>
        ) : compras.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 text-gray-400">
            <TruckIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="font-bold text-sm">No se encontraron compras</p>
            <p className="text-xs max-w-xs mt-1">Registra tu primera compra con proveedores usando el botón "Nueva Compra".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Factura</th>
                  <th className="px-6 py-4">Fecha Emisión</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Registrado por</th>
                  <th className="px-6 py-4 text-right">Total Factura</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right w-[100px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-colors">
                    {/* Invoice Num */}
                    <td className="px-6 py-4 font-bold text-sm text-gray-900 dark:text-white">
                      #{compra.numeroFactura}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(compra.fecha).toLocaleDateString("es-EC", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>

                    {/* Supplier */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-xs text-gray-700 dark:text-gray-300">
                        {compra.proveedor?.nombre || "S/P"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        RUC: {compra.proveedor?.ruc_nit}
                      </p>
                    </td>

                    {/* Registrado Por */}
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {compra.usuario?.nombre || "Usuario"}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 text-right font-black text-sm text-gray-900 dark:text-white">
                      {formatCurrency(compra.total)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold ${
                          compra.estado === "Completado"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                        }`}
                      >
                        {compra.estado}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetail(compra.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all"
                        title="Ver Detalles"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/10">
            <span className="text-xs text-gray-400">Total: {total} compras</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 text-gray-500"
              >
                Anterior
              </button>
              <button
                disabled={currentPage * 10 >= total}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 text-gray-500"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Purchase Detail Slider/Modal */}
      <AnimatePresence>
        {selectedCompraId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedCompraId(null);
                setSelectedCompra(null);
              }}
              className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full max-w-lg h-full bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-900 shadow-2xl flex flex-col z-10"
            >
              {detailLoading || !selectedCompra ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-8 h-8 animate-spin text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs">Cargando detalles de factura...</span>
                </div>
              ) : (
                <>
                  {/* Slider Header */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                        Factura #{selectedCompra.numeroFactura}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        Detalle de compra con Proveedores
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCompraId(null);
                        setSelectedCompra(null);
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Slider Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* General info */}
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-100 dark:border-gray-900 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> Fecha Factura:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{formatDate(selectedCompra.fecha)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1"><TruckIcon className="w-3.5 h-3.5" /> Proveedor:</span>
                        <span className="font-black text-gray-800 dark:text-gray-200">{selectedCompra.proveedor?.nombre}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Comprador:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{selectedCompra.usuario?.nombre}</span>
                      </div>
                    </div>

                    {/* Product rows detail */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Productos Adquiridos</h4>
                      <div className="border border-gray-100 dark:border-gray-900 rounded-xl divide-y divide-gray-100 dark:divide-gray-900 overflow-hidden">
                        {selectedCompra.detalles?.map((det) => (
                          <div key={det.id} className="p-3.5 flex items-center justify-between bg-white dark:bg-gray-950 hover:bg-gray-50/50">
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{det.parte?.nombre}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Cód: {det.parte?.codigoInterno}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                                {det.cantidad} <span className="text-[10px] text-gray-400 uppercase">{det.parte?.unidadMedida}</span>
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                x {formatCurrency(det.precioUnitario)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observation comments */}
                    {selectedCompra.comentario && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Observaciones</h4>
                        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-950/20 text-xs italic text-gray-500 leading-relaxed">
                          {selectedCompra.comentario}
                        </div>
                      </div>
                    )}

                    {/* Tax breakdown & totals */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-900/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Subtotal:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(selectedCompra.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">IVA ({selectedCompra.ivaPorcentaje}%):</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(selectedCompra.ivaMonto)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-250/20">
                        <span className="font-bold text-gray-800 dark:text-gray-200">Total Factura:</span>
                        <span className="font-black text-base text-gray-900 dark:text-white">{formatCurrency(selectedCompra.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slider Footer Actions */}
                  {selectedCompra.estado === "Completado" && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/20">
                      <Button
                        onClick={handleVoidPurchase}
                        disabled={isVoiding}
                        className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 h-11 text-xs font-bold dark:bg-rose-950/10 dark:hover:bg-rose-950/30 dark:border-rose-900"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        {isVoiding ? "Anulando Compra..." : "Anular Factura de Compra"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
