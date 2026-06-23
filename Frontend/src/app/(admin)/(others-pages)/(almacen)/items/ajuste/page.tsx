'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import {
  ArchiveBoxIcon,
  ChevronLeftIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckIcon,
  TruckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAjusteInventario } from "@/hooks/useAjusteInventario";
import { apiRequest } from "@/lib/api";
import { ItemAlmacen } from "@/hooks/useAlmacen";
import { useProveedor, Proveedor } from "@/hooks/useProveedor";
import { useCompra } from "@/hooks/useCompra";

// Motivos predefinidos
const MOTIVOS_PREDEFINIDOS = [
  { value: "", label: "— Selecciona un motivo —", icon: null, isCompras: false },
  { value: "Registro de Compra", label: "🛒 Registro de Compra (Entrada de mercadería)", icon: "compras", isCompras: true },
  { value: "Auditoría Física", label: "📋 Auditoría Física de Inventario", icon: null, isCompras: false },
  { value: "Ajuste por Avería", label: "⚠️ Ajuste por Avería / Daño de Producto", icon: null, isCompras: false },
  { value: "Devolución de Cliente", label: "↩️ Devolución de Cliente", icon: null, isCompras: false },
  { value: "Merma / Pérdida", label: "📉 Merma o Pérdida de Stock", icon: null, isCompras: false },
  { value: "Corrección de Error", label: "🔧 Corrección de Error de Registro", icon: null, isCompras: false },
  { value: "Transferencia de Stock", label: "🔄 Transferencia / Reubicación de Stock", icon: null, isCompras: false },
  { value: "Otro", label: "📝 Otro motivo", icon: null, isCompras: false },
];

interface WorkbenchItem {
  parte: ItemAlmacen;
  stockFisico: number;     // used in normal adjustment mode
  precioCosto: number;     // unit purchase price (compras mode)
  cantidadCompra: number;  // direct quantity to buy (compras mode)
}

export default function AjusteInventarioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { guardarAjuste, loading: saving } = useAjusteInventario();
  const { fetchActiveProveedores } = useProveedor();
  const { guardarCompra, loading: savingCompra } = useCompra();

  // Form states
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [workbench, setWorkbench] = useState<WorkbenchItem[]>([]);

  // Purchase sub-fields (visible when motivo = 'Registro de Compra')
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compraProveedorId, setCompraProveedorId] = useState<string>("");
  const [compraNumFactura, setCompraNumFactura] = useState("");
  const [compraFecha, setCompraFecha] = useState(new Date().toISOString().split("T")[0]);
  const [compraIva, setCompraIva] = useState<number>(15);

  const isComprasMotivo = motivo === "Registro de Compra";

  // Search autocomplete states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItemAlmacen[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Confirmation modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Load suppliers when motivo = Compras
  useEffect(() => {
    if (isComprasMotivo && session?.accessToken) {
      fetchActiveProveedores().then(setProveedores).catch(console.error);
    }
  }, [isComprasMotivo, session, fetchActiveProveedores]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search items as user types
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      if (!session?.accessToken) return;
      try {
        setSearchLoading(true);
        // Exclude services (only physical products can be adjusted)
        const url = `/partes/all?limit=15&page=1&isNotServicio=true&search=${encodeURIComponent(searchQuery)}`;
        const data = await apiRequest<any>(url, {}, session);
        if (data && Array.isArray(data.items)) {
          setSearchResults(data.items);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error("Error searching items:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, session]);

  // Add item to workbench
  const handleAddItem = (item: ItemAlmacen) => {
    // Check if already in workbench
    if (workbench.some(w => w.parte.id === item.id)) {
      toast.warning(`"${item.nombre}" ya está agregado en la lista.`);
      return;
    }

    setWorkbench(prev => [...prev, {
      parte: item,
      stockFisico: Number(item.stock),
      precioCosto: Number(item.costo || 0),
      cantidadCompra: 1, // default 1 unit to buy
    }]);
    setSearchQuery("");
    setIsDropdownOpen(false);
    toast.success(`"${item.nombre}" agregado al tablero.`);
  };

  // Handle direct quantity change in compras mode
  const handleCantidadCompraChange = (id: number, val: string) => {
    const num = val === "" ? 0 : parseFloat(val);
    const checked = isNaN(num) || num < 0 ? 0 : num;
    setWorkbench(prev => prev.map(w => w.parte.id === id ? { ...w, cantidadCompra: checked } : w));
  };

  // Handle price change per item (compras mode)
  const handlePriceChange = (id: number, val: string) => {
    const num = val === "" ? 0 : parseFloat(val);
    const checked = isNaN(num) || num < 0 ? 0 : num;
    setWorkbench(prev => prev.map(w => w.parte.id === id ? { ...w, precioCosto: checked } : w));
  };

  // Remove item from workbench
  const handleRemoveItem = (id: number) => {
    setWorkbench(prev => prev.filter(w => w.parte.id !== id));
  };

  // Handle stock input change
  const handleStockChange = (id: number, val: string) => {
    // Allows empty, decimals, or negative if applicable (usually stock is non-negative)
    const num = val === "" ? 0 : parseFloat(val);
    const checkedNum = isNaN(num) || num < 0 ? 0 : num;

    setWorkbench(prev =>
      prev.map(w => (w.parte.id === id ? { ...w, stockFisico: checkedNum } : w))
    );
  };

  // Handle difference input change (bi-directional sync)
  const handleDifferenceChange = (id: number, val: string) => {
    const diffNum = val === "" ? 0 : parseFloat(val);
    const checkedDiff = isNaN(diffNum) ? 0 : diffNum;

    setWorkbench(prev =>
      prev.map(w => {
        if (w.parte.id === id) {
          const stockSis = Number(w.parte.stock || 0);
          const calculatedStockFisico = stockSis + checkedDiff;
          const checkedStockFisico = calculatedStockFisico < 0 ? 0 : calculatedStockFisico;
          return { ...w, stockFisico: checkedStockFisico };
        }
        return w;
      })
    );
  };

  // Submit adjustment to server
  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast.error("Por favor, selecciona el motivo del ajuste.");
      return;
    }
    if (isComprasMotivo && !compraProveedorId) {
      toast.error("Para un ajuste por Compra, debes seleccionar un proveedor.");
      return;
    }
    if (isComprasMotivo && !compraNumFactura.trim()) {
      toast.error("Para un ajuste por Compra, ingresa el número de factura.");
      return;
    }
    if (workbench.length === 0) {
      toast.error("Debes agregar al menos un repuesto para ajustar.");
      return;
    }

    // Validate prices and quantities in compras mode
    if (isComprasMotivo) {
      const itemSinCantidad = workbench.find(w => w.cantidadCompra <= 0);
      if (itemSinCantidad) {
        toast.error(`La cantidad a comprar de "${itemSinCantidad.parte.nombre}" debe ser mayor a 0.`);
        return;
      }
      const itemSinPrecio = workbench.find(w => w.precioCosto <= 0);
      if (itemSinPrecio) {
        toast.error(`Ingresa un precio de compra válido para "${itemSinPrecio.parte.nombre}".`);
        return;
      }
    }

    // Build rich comentario for purchase motivo
    let finalComentario = comentario.trim();
    if (isComprasMotivo) {
      const provName = proveedores.find(p => p.id === Number(compraProveedorId))?.nombre || "Proveedor";
      const purchaseInfo = `[Compra] Factura: ${compraNumFactura} | Proveedor: ${provName} | Fecha: ${compraFecha} | IVA: ${compraIva}%`;
      finalComentario = finalComentario ? `${purchaseInfo} — ${finalComentario}` : purchaseInfo;
    }

    try {
      // 1. If compras motivo: first create the real Compra record
      if (isComprasMotivo) {
        const compraDetalles = workbench.map(w => ({
          parteId: w.parte.id,
          cantidad: w.cantidadCompra, // direct quantity entered by user
          precioUnitario: w.precioCosto,
          actualizarCosto: true,
        }));

        await guardarCompra({
          numeroFactura: compraNumFactura.trim(),
          proveedorId: Number(compraProveedorId),
          fecha: new Date(compraFecha).toISOString(),
          ivaPorcentaje: compraIva,
          comentario: comentario.trim() || undefined,
          detalles: compraDetalles,
        });
        toast.success("✅ Factura de compra registrada en el módulo de Compras.");
        // After compra registers, stock is already updated by the API.
        // So we redirect directly, no need for a separate ajuste that double-counts.
        router.push("/items/compras");
        return;
      }

      // 2. Regular adjustment (non-compras)
      const detalles = workbench.map(w => ({
        parteId: w.parte.id,
        stockFisico: w.stockFisico,
      }));

      const res = await guardarAjuste(motivo.trim(), finalComentario, detalles);
      if (res) {
        toast.success("Ajuste de inventario guardado y aplicado con éxito");
        router.push("/items");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el ajuste de inventario.");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/items")}
          aria-label="Volver al inventario"
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <PageBreadcrumb pageTitle="Ajuste Rápido de Inventario" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Info & Autocomplete Search */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <h2 className="sr-only">Formulario de Ajuste de Inventario</h2>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-amber-500" aria-hidden="true" />
              Datos del Ajuste
            </h3>

            {/* Motivo Select */}
            <div className="space-y-1.5">
              <label htmlFor="motivoAjuste" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Motivo del Ajuste <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id="motivoAjuste"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-brand-500 focus:bg-white transition-all text-sm outline-none dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:focus:bg-gray-900 dark:text-white"
              >
                {MOTIVOS_PREDEFINIDOS.map(op => (
                  <option key={op.value} value={op.value} disabled={op.value === ""}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Sub-fields (animated) */}
            <AnimatePresence>
              {isComprasMotivo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-1 border-t border-blue-100 dark:border-blue-900/30 mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TruckIcon className="w-4 h-4 text-blue-500" aria-hidden="true" />
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Datos de Factura de Compra</span>
                    </div>

                    {/* Proveedor */}
                    <div className="space-y-1">
                      <label htmlFor="compraProveedor" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Proveedor *</label>
                      <select
                        id="compraProveedor"
                        value={compraProveedorId}
                        onChange={e => setCompraProveedorId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white transition-all text-xs outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="">Selecciona un proveedor...</option>
                        {proveedores.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} (RUC: {p.ruc_nit})</option>
                        ))}
                      </select>
                    </div>

                    {/* Nº Factura */}
                    <div className="space-y-1">
                      <label htmlFor="compraFactura" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Nº Factura *</label>
                      <input
                        id="compraFactura"
                        type="text"
                        placeholder="Ej: 001-002-00012345"
                        value={compraNumFactura}
                        onChange={e => setCompraNumFactura(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white transition-all text-xs outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>

                    {/* Fecha + IVA side by side */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="compraFecha" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Fecha Emisión</label>
                        <input
                          id="compraFecha"
                          type="date"
                          value={compraFecha}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={e => setCompraFecha(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white transition-all text-xs outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="compraIva" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">% IVA</label>
                        <select
                          id="compraIva"
                          value={compraIva}
                          onChange={e => setCompraIva(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white transition-all text-xs outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        >
                          <option value={15}>15%</option>
                          <option value={8}>8%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0% (Exento)</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                      💡 El proveedor y factura quedarán registrados en las observaciones del ajuste.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comentario Input */}
            <div className="space-y-1.5">
              <label htmlFor="ajusteComentario" className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Observaciones / Comentarios
              </label>
              <textarea
                id="ajusteComentario"
                rows={3}
                placeholder="Escribe comentarios adicionales u observaciones..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-brand-500 focus:bg-white transition-all text-sm outline-none dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:focus:bg-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Autocomplete Search Drawer */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Buscar Repuestos</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Escribe para buscar y añadir repuestos al tablero de ajuste.</p>
            </div>

            <div className="relative" ref={dropdownRef}>
              <label htmlFor="buscarRepuesto" className="sr-only">Buscar producto por nombre, código o modelo</label>
              <div className="relative">
                <input
                  id="buscarRepuesto"
                  type="text"
                  placeholder="Buscar por nombre, código o modelo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-brand-500 focus:bg-white transition-all text-sm outline-none dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:focus:bg-gray-900 dark:text-white"
                />
                <MagnifyingGlassIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                {searchLoading && (
                  <svg className="absolute right-3.5 top-3.5 w-4 h-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>

              {/* Dropdown results — opens UPWARD */}
              <AnimatePresence>
                {isDropdownOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute z-20 left-0 right-0 bottom-full mb-2 max-h-[280px] overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl dark:bg-gray-950 dark:border-gray-800 custom-scrollbar"
                  >
                    {searchResults.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-900/50 flex items-center justify-between transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-500">
                            {item.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-600 dark:text-gray-400 font-mono">
                              {item.codigoInterno || "SIN-COD"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              Mod: {item.modelo || "Genérico"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-gray-400 block">Stock:</span>
                          <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                            {item.stock} {item.unidadMedida}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Workbench / Table Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/20">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Tablero de Ajustes Activos</h3>
                <p className="text-xs text-gray-400">Modifica el stock físico para ver las diferencias calculadas.</p>
              </div>
              <span className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full">
                {workbench.length} Repuestos agregados
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              {workbench.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6 space-y-3">
                  <ArchiveBoxIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 animate-pulse" />
                  <div>
                    <p className="font-bold text-sm text-gray-600 dark:text-gray-400">Tu tablero de ajuste está vacío</p>
                    <p className="text-xs max-w-[300px] mt-1 mx-auto text-gray-600 dark:text-gray-400">Utiliza el buscador de la izquierda para seleccionar los productos que deseas corregir.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5" scope="col">Repuesto / Producto</th>
                      <th className="px-5 py-3.5 text-center" scope="col">Stock Sistema</th>
                      <th className="px-5 py-3.5 text-center w-[120px]" scope="col">{isComprasMotivo ? "Cant. a Comprar" : "Stock Físico"}</th>
                      <th className="px-5 py-3.5 text-center w-[130px]" scope="col">{isComprasMotivo ? "Precio Unitario" : "Diferencia (±)"}</th>
                      <th className="px-5 py-3.5 text-right w-[60px]" scope="col">Remover</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {workbench.map(({ parte, stockFisico, precioCosto, cantidadCompra }) => {
                      const stockSis = Number(parte.stock || 0);
                      const diff = stockFisico - stockSis;
                      const stockTraCompra = stockSis + cantidadCompra;

                      return (
                        <tr key={parte.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-colors">
                          {/* Name & Details */}
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-sm text-gray-900 dark:text-white">
                              {parte.nombre}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              <span className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-600 dark:text-gray-400 font-mono">
                                {parte.codigoInterno || "SIN-COD"}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                Mod: {parte.modelo || "S/M"}
                              </span>
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="px-5 py-3.5 text-center font-bold text-sm text-gray-600 dark:text-gray-300">
                            {stockSis} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal uppercase">{parte.unidadMedida}</span>
                          </td>

                          {/* Compras mode: direct qty input | Normal mode: stockFisico input */}
                          <td className="px-5 py-3.5">
                            {isComprasMotivo ? (
                              <div className="space-y-0.5">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={cantidadCompra === 0 ? "" : cantidadCompra}
                                  placeholder="1"
                                  onChange={e => handleCantidadCompraChange(parte.id, e.target.value)}
                                  className="w-full text-center px-3 py-1.5 rounded-lg border border-emerald-200 focus:border-emerald-500 outline-none text-sm font-bold bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300 shadow-sm"
                                />
                                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                   Stock tras compra: <span className="font-bold text-emerald-600 dark:text-emerald-400">{stockTraCompra}</span>
                                </p>
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={stockFisico}
                                onChange={e => handleStockChange(parte.id, e.target.value)}
                                className="w-full text-center px-3 py-1.5 rounded-lg border border-gray-200 focus:border-brand-500 outline-none text-sm font-bold bg-white dark:bg-gray-950 dark:border-gray-800 dark:focus:border-brand-500 dark:text-white shadow-sm"
                              />
                            )}
                          </td>

                          {/* Diferencia (normal) OR Precio Unitario (compras) */}
                          <td className="px-5 py-3.5">
                            {isComprasMotivo ? (
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-xs text-gray-400">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={precioCosto === 0 ? "" : precioCosto}
                                  placeholder="0.00"
                                  onChange={e => handlePriceChange(parte.id, e.target.value)}
                                  className="w-full text-center pl-6 pr-2 py-1.5 rounded-lg border border-blue-200 outline-none text-sm font-bold bg-blue-50 focus:border-blue-500 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-300 shadow-sm"
                                />
                              </div>
                            ) : (
                              <input
                                type="number"
                                step="any"
                                value={diff === 0 ? "" : diff}
                                placeholder="0"
                                onChange={e => handleDifferenceChange(parte.id, e.target.value)}
                                className={`w-full text-center px-3 py-1.5 rounded-lg border outline-none text-sm font-bold shadow-sm transition-all ${
                                  diff > 0
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 focus:border-emerald-500"
                                    : diff < 0
                                    ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 focus:border-rose-500"
                                    : "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800/40 dark:border-gray-800 dark:text-gray-300 focus:border-brand-500"
                                }`}
                              />
                            )}
                          </td>

                          {/* Action Delete */}
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRemoveItem(parte.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                              aria-label={`Remover ${parte.nombre} del tablero`}
                            >
                              <TrashIcon className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Actions inside workbench */}
            {workbench.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/10 flex items-center justify-between">
                <button
                  onClick={() => setWorkbench([])}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Limpiar todo el tablero
                </button>

                <Button
                  onClick={() => setIsConfirmOpen(true)}
                  className="px-6 bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 font-bold text-sm h-10 border-none"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  <span>Aplicar Ajuste</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Summary Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 overflow-hidden dark:bg-gray-900 dark:border-gray-800 z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <ExclamationCircleIcon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar Auditoría de Stock</h3>
                  <p className="text-xs text-gray-400">Revisa la lista antes de aplicar los cambios irreversibles.</p>
                </div>
              </div>

              {/* Scrollable list summary */}
              <div className="max-h-[250px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 custom-scrollbar mb-5">
                {workbench.map(({ parte, stockFisico }) => {
                  const stockSis = Number(parte.stock || 0);
                  const diff = stockFisico - stockSis;

                  return (
                    <div key={parte.id} className="p-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-950/30">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">{parte.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{parte.codigoInterno || "SIN-COD"}</p>
                      </div>
                      <div className="shrink-0 text-right flex items-center gap-3">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">Nuevo Stock:</span>
                          <span className="text-xs font-black text-gray-700 dark:text-gray-300">{stockFisico}</span>
                        </div>
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold min-w-[40px] ${
                            diff > 0
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : diff < 0
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Motivo summary */}
              <div className="bg-gray-50 dark:bg-gray-950/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 mb-6 space-y-2">
                <div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Motivo:</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{motivo}</span>
                </div>
                {comentario.trim() && (
                  <div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Observaciones:</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block italic leading-relaxed">{comentario}</span>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors text-gray-500 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400"
                >
                  Cancelar
                </button>

                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs h-10 border-none shadow-lg shadow-brand-500/20"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Confirmar y Aplicar</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
