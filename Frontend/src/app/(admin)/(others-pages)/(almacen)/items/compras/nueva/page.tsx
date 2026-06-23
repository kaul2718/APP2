'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import {
  ChevronLeftIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  CheckIcon,
  ExclamationCircleIcon,
  DocumentPlusIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useCompra } from "@/hooks/useCompra";
import { useProveedor, Proveedor } from "@/hooks/useProveedor";
import { ItemAlmacen } from "@/hooks/useAlmacen";
import { apiRequest } from "@/lib/api";

interface PurchaseLine {
  parte: ItemAlmacen;
  cantidad: number;
  precioUnitario: number;
  actualizarCosto: boolean;
}

export default function NuevaCompraPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { guardarCompra, loading: saving } = useCompra();
  const { fetchActiveProveedores, crearProveedor } = useProveedor();

  // Form Fields
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | string>("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(15); // Default 15%
  const [comentario, setComentario] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  // Autocomplete Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItemAlmacen[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Instant Supplier Creator Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierRuc, setNewSupplierRuc] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [supplierSaving, setSupplierSaving] = useState(false);

  // Review & Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Load suppliers list
  const loadSuppliers = async () => {
    try {
      const list = await fetchActiveProveedores();
      setProveedores(list);
    } catch (err) {
      console.error("Error loading suppliers:", err);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      loadSuppliers();
    }
  }, [session, fetchActiveProveedores]);

  // Click outside listener for product autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete search
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
        // Exclude services (only physical products can be purchased)
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
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, session]);

  // Add item to purchase workbench
  const handleAddItem = (item: ItemAlmacen) => {
    if (lines.some(l => l.parte.id === item.id)) {
      toast.warning(`"${item.nombre}" ya se encuentra agregado en el listado.`);
      return;
    }

    setLines(prev => [
      ...prev,
      {
        parte: item,
        cantidad: 1,
        precioUnitario: Number(item.costo || 0),
        actualizarCosto: true // Defaults to true
      }
    ]);
    setSearchQuery("");
    setIsDropdownOpen(false);
    toast.success(`"${item.nombre}" agregado.`);
  };

  // Remove item
  const handleRemoveLine = (id: number) => {
    setLines(prev => prev.filter(l => l.parte.id !== id));
  };

  // Update line details
  const handleLineQtyChange = (id: number, val: string) => {
    const qty = val === "" ? 0 : parseFloat(val);
    const checked = isNaN(qty) || qty < 0 ? 0 : qty;
    setLines(prev => prev.map(l => l.parte.id === id ? { ...l, cantidad: checked } : l));
  };

  const handleLinePriceChange = (id: number, val: string) => {
    const price = val === "" ? 0 : parseFloat(val);
    const checked = isNaN(price) || price < 0 ? 0 : price;
    setLines(prev => prev.map(l => l.parte.id === id ? { ...l, precioUnitario: checked } : l));
  };

  const handleLineToggleCosto = (id: number) => {
    setLines(prev => prev.map(l => l.parte.id === id ? { ...l, actualizarCosto: !l.actualizarCosto } : l));
  };

  // Calculations
  const calculatedSubtotal = lines.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0);
  const calculatedIva = calculatedSubtotal * (ivaPorcentaje / 100);
  const calculatedTotal = calculatedSubtotal + calculatedIva;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(val);
  };

  // Fast supplier save
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      toast.error("El nombre del proveedor es obligatorio.");
      return;
    }
    if (!newSupplierRuc.trim()) {
      toast.error("El RUC / Identificación es obligatorio.");
      return;
    }

    setSupplierSaving(true);
    try {
      const res = await crearProveedor({
        nombre: newSupplierName.trim(),
        ruc_nit: newSupplierRuc.trim(),
        correo: newSupplierEmail.trim() || undefined,
        telefono: newSupplierPhone.trim() || undefined,
        direccion: newSupplierAddress.trim() || undefined,
      });

      if (res) {
        toast.success(`Proveedor "${res.nombre}" registrado exitosamente.`);
        await loadSuppliers(); // reload active suppliers
        setSelectedProveedorId(res.id); // auto-select newly created supplier!
        setIsSupplierModalOpen(false);
        // reset form
        setNewSupplierName("");
        setNewSupplierRuc("");
        setNewSupplierEmail("");
        setNewSupplierPhone("");
        setNewSupplierAddress("");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al registrar el proveedor.");
    } finally {
      setSupplierSaving(false);
    }
  };

  // Main Submit handler
  const handleSubmit = async () => {
    if (!selectedProveedorId) {
      toast.error("Por favor, selecciona un proveedor.");
      return;
    }
    if (!numeroFactura.trim()) {
      toast.error("Por favor, ingresa el número de factura de compra.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Debes agregar al menos un producto a la compra.");
      return;
    }
    if (lines.some(l => l.cantidad <= 0)) {
      toast.error("Todas las cantidades deben ser superiores a 0.");
      return;
    }

    try {
      const payload = {
        numeroFactura: numeroFactura.trim(),
        proveedorId: Number(selectedProveedorId),
        fecha: new Date(fecha).toISOString(),
        ivaPorcentaje,
        comentario: comentario.trim() || undefined,
        detalles: lines.map(l => ({
          parteId: l.parte.id,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          actualizarCosto: l.actualizarCosto
        }))
      };

      const res = await guardarCompra(payload);
      if (res) {
        toast.success("Factura de compra registrada e inventario actualizado exitosamente.");
        router.push("/items/compras");
      }
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error registrando la compra.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/items/compras")}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
          aria-label="Volver a compras"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <PageBreadcrumb pageTitle="Registrar Nueva Compra" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form and workbench (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header invoice metadata */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Cabecera de Factura</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier Selection */}
              <div>
                <label htmlFor="proveedor-select" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Proveedor *
                </label>
                <div className="flex gap-2">
                  <select
                    id="proveedor-select"
                    value={selectedProveedorId}
                    onChange={(e) => setSelectedProveedorId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white transition-all"
                  >
                    <option value="">Selecciona un Proveedor...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (RUC: {p.ruc_nit})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="px-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 flex items-center justify-center dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 transition-colors"
                    title="Añadir Nuevo Proveedor Rápido"
                    aria-label="Añadir nuevo proveedor"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Invoice Number */}
              <div>
                <label htmlFor="numero-factura-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Nº Factura de Proveedor *
                </label>
                <input
                  id="numero-factura-input"
                  type="text"
                  placeholder="Ej: 001-002-00012345"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white transition-all"
                />
              </div>

              {/* Issue Date */}
              <div>
                <label htmlFor="fecha-emision-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Fecha de Emisión *
                </label>
                <input
                  id="fecha-emision-input"
                  type="date"
                  value={fecha}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white transition-all"
                />
              </div>

              {/* Tax rate select (0, 5, 8, 15) */}
              <div>
                <label htmlFor="porcentaje-iva-select" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Porcentaje de IVA *
                </label>
                <select
                  id="porcentaje-iva-select"
                  value={ivaPorcentaje}
                  onChange={(e) => setIvaPorcentaje(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white transition-all"
                >
                  <option value={15}>IVA 15% (Ecuador actual)</option>
                  <option value={8}>IVA 8% (Feriados/Especial)</option>
                  <option value={5}>IVA 5% (Materiales)</option>
                  <option value={0}>IVA 0% (Exento)</option>
                </select>
              </div>
            </div>
          </div>
                     {/* Autocomplete Product search and selection */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Listado de Repuestos</h2>
              <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Excluye Servicios
              </span>
            </div>

            {/* Auto Search container */}
            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar repuesto por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-brand-500 focus:bg-white transition-all text-sm outline-none dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white"
                  aria-label="Buscar repuesto por nombre o código"
                />
                <MagnifyingGlassIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                {searchLoading && (
                  <div className="absolute right-3.5 top-3.5">
                    <svg className="animate-spin h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              <AnimatePresence>
                {isDropdownOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-30 w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar"
                  >
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddItem(item)}
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-950 flex items-center justify-between border-b border-gray-100 last:border-0 dark:border-gray-800 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{item.nombre}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Código: {item.codigoInterno} | Unidad: {item.unidadMedida}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-600 dark:text-brand-400">Stock: {item.stock}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Costo actual: {formatCurrency(item.costo)}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Purchases Workbench Table */}
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              {lines.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  <DocumentPlusIcon className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  No has añadido ningún repuesto a la compra. Utiliza el buscador superior para añadir ítems.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-950/20 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Repuesto / Producto</th>
                      <th className="px-4 py-3 text-center w-[80px]">Stock Act.</th>
                      <th className="px-4 py-3 text-center w-[100px]">Cant. Comprar</th>
                      <th className="px-4 py-3 text-center w-[120px]">Precio Compra</th>
                      <th className="px-4 py-3 text-center w-[120px]">Actualizar Costo</th>
                      <th className="px-4 py-3 text-right w-[100px]">Subtotal</th>
                      <th className="px-4 py-3 text-center w-[50px]"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {lines.map((line) => {
                      const itemSubtotal = line.cantidad * line.precioUnitario;
                      return (
                        <tr key={line.parte.id} className="hover:bg-gray-50/20 dark:hover:bg-gray-950/10">
                          {/* Name & Code */}
                          <td className="px-4 py-3">
                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{line.parte.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">Cód: {line.parte.codigoInterno}</p>
                          </td>

                          {/* Current Stock */}
                          <td className="px-4 py-3 text-center font-bold text-xs text-gray-500 dark:text-gray-400">
                            {line.parte.stock}
                          </td>

                          {/* Purchase Quantity */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={line.cantidad === 0 ? "" : line.cantidad}
                              onChange={(e) => handleLineQtyChange(line.parte.id, e.target.value)}
                              className="w-full text-center px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-bold focus:border-brand-500 outline-none dark:text-white"
                              aria-label={`Cantidad a comprar para ${line.parte.nombre}`}
                            />
                          </td>

                          {/* Unit Purchase Price */}
                          <td className="px-4 py-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">$</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={line.precioUnitario === 0 ? "" : line.precioUnitario}
                                onChange={(e) => handleLinePriceChange(line.parte.id, e.target.value)}
                                className="w-full text-center pl-5 pr-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-bold focus:border-brand-500 outline-none dark:text-white"
                                aria-label={`Precio de compra para ${line.parte.nombre}`}
                              />
                            </div>
                          </td>

                          {/* Update Cost Flag Toggle */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleLineToggleCosto(line.parte.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                                line.actualizarCosto
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
                                  : "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-500"
                              }`}
                            >
                              <CheckIcon className={`w-3.5 h-3.5 ${line.actualizarCosto ? "opacity-100" : "opacity-0"}`} />
                              <span>{line.actualizarCosto ? "Sí (Actualizar)" : "No (Conservar)"}</span>
                            </button>
                          </td>

                          {/* Subtotal */}
                          <td className="px-4 py-3 text-right font-black text-xs text-gray-800 dark:text-gray-200">
                            {formatCurrency(itemSubtotal)}
                          </td>

                          {/* Trash row delete action */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.parte.id)}
                              className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              aria-label={`Eliminar ${line.parte.nombre} de la lista`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Totals panel, Observations & Confirmation (1 col) */}
        <div className="space-y-6">
          {/* Notes and comments */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <label htmlFor="observaciones-textarea" className="block text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Observaciones de Compra</label>
            <textarea
              id="observaciones-textarea"
              placeholder="Detalles sobre la entrega, transporte, o créditos de factura..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white transition-all resize-none"
            />
          </div>

          {/* Checkout/Calculations panel */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Caja de Liquidación</h2>
            
            <div className="space-y-3 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Subtotal Neto:</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(calculatedSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>IVA Compra ({ivaPorcentaje}%):</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(calculatedIva)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Total a Liquidar:</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(calculatedTotal)}</span>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={lines.length === 0 || !selectedProveedorId || !numeroFactura.trim()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none h-11 text-xs font-bold disabled:opacity-50"
              >
                <CheckIcon className="w-5 h-5" />
                <span>Confirmar y Procesar Compra</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Instant Fast Supplier Creator */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-2xl max-w-md w-full border border-gray-150 dark:border-gray-900 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlusIcon className="w-5 h-5 text-blue-500" />
                  Nuevo Proveedor Rápido
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Comercial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Computación Mayorista S.A."
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  {/* RUC / TAX ID */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">RUC / Cédula / Identificación *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1792345678001"
                      value={newSupplierRuc}
                      onChange={(e) => setNewSupplierRuc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Email & Phone side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="ventas@proveedor.com"
                        value={newSupplierEmail}
                        onChange={(e) => setNewSupplierEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Teléfono</label>
                      <input
                        type="text"
                        placeholder="0998765432"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dirección Física</label>
                    <textarea
                      placeholder="Av. 10 de Agosto N34-21 y Rumipamba"
                      value={newSupplierAddress}
                      onChange={(e) => setNewSupplierAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-900 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/20 -mx-6 -mb-6 p-4">
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    disabled={supplierSaving}
                    className="px-5 bg-blue-600 hover:bg-blue-700 text-white border-none text-xs font-bold flex items-center gap-1.5 h-10"
                  >
                    {supplierSaving ? (
                      <>
                        <ArrowPathIcon className="animate-spin w-4 h-4" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>Guardar Proveedor</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Summary Review Confirmation before saving */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-2xl max-w-lg w-full border border-gray-150 dark:border-gray-900 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/20">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />
                  Revisión Final de Compra
                </h3>
              </div>

              <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Por favor, confirma los detalles antes de aplicar la entrada de mercadería. Esta acción incrementará el stock actual del inventario de forma inmediata.
                </p>

                {/* Metadata Review */}
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Proveedor:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {proveedores.find(p => p.id === Number(selectedProveedorId))?.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Factura nº:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">#{numeroFactura}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha Emisión:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{fecha}</span>
                  </div>
                </div>

                {/* Grid items Review */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resumen de Ítems</h4>
                  <div className="border border-gray-100 dark:border-gray-900 rounded-xl divide-y divide-gray-100 dark:divide-gray-900 overflow-hidden text-xs">
                    {lines.map((l) => (
                      <div key={l.parte.id} className="p-3 bg-white dark:bg-gray-950 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{l.parte.nombre}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-mono">
                            {l.actualizarCosto ? "✓ Actualizará costo a: " : "✕ Conservará costo anterior en: "}
                            {formatCurrency(l.precioUnitario)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800 dark:text-gray-200">
                            {l.cantidad} und. x {formatCurrency(l.precioUnitario)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-black">
                            {formatCurrency(l.cantidad * l.precioUnitario)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Checkout Review */}
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal Neto:</span>
                    <span className="font-bold">{formatCurrency(calculatedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>IVA ({ivaPorcentaje}%):</span>
                    <span className="font-bold">{formatCurrency(calculatedIva)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-250/20 text-gray-800 dark:text-white">
                    <span>Total General:</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(calculatedTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-900 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/20">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Regresar y Editar
                </button>
                <Button
                  onClick={() => {
                    setIsConfirmOpen(false);
                    handleSubmit();
                  }}
                  disabled={saving}
                  className="px-5 bg-blue-600 hover:bg-blue-700 text-white border-none text-xs font-bold flex items-center gap-1.5 h-10"
                >
                  {saving ? (
                    <>
                      <ArrowPathIcon className="animate-spin w-4 h-4" />
                      <span>Liquidando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Liquidar Factura</span>
                    </>
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
