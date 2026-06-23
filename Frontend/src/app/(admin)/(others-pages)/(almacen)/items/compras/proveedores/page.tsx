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
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useProveedor, Proveedor } from "@/hooks/useProveedor";

export default function ProveedoresPage() {
  const router = useRouter();
  const {
    proveedores,
    loading,
    total,
    fetchProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
  } = useProveedor();

  // Page Grid States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Editor Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  
  // Modal Fields
  const [nombre, setNombre] = useState("");
  const [rucNit, setRucNit] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load suppliers grid
  useEffect(() => {
    fetchProveedores(currentPage, 10, searchTerm);
  }, [currentPage, searchTerm, fetchProveedores]);

  // Debounced search reset
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProveedor(null);
    setNombre("");
    setRucNit("");
    setCorreo("");
    setTelefono("");
    setDireccion("");
    setEstado(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setNombre(proveedor.nombre);
    setRucNit(proveedor.ruc_nit);
    setCorreo(proveedor.correo || "");
    setTelefono(proveedor.telefono || "");
    setDireccion(proveedor.direccion || "");
    setEstado(proveedor.estado);
    setIsModalOpen(true);
  };

  // Save / Update Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre del proveedor es obligatorio.");
      return;
    }
    if (!rucNit.trim()) {
      toast.error("El RUC / Identificación es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      if (editingProveedor) {
        // Edit Mode
        const res = await actualizarProveedor(editingProveedor.id, {
          nombre: nombre.trim(),
          ruc_nit: rucNit.trim(),
          correo: correo.trim() || undefined,
          telefono: telefono.trim() || undefined,
          direccion: direccion.trim() || undefined,
          estado,
        });
        if (res) {
          toast.success("Proveedor actualizado exitosamente.");
          setIsModalOpen(false);
          fetchProveedores(currentPage, 10, searchTerm);
        }
      } else {
        // Create Mode
        const res = await crearProveedor({
          nombre: nombre.trim(),
          ruc_nit: rucNit.trim(),
          correo: correo.trim() || undefined,
          telefono: telefono.trim() || undefined,
          direccion: direccion.trim() || undefined,
        });
        if (res) {
          toast.success("Proveedor registrado exitosamente.");
          setIsModalOpen(false);
          fetchProveedores(currentPage, 10, searchTerm);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el proveedor.");
    } finally {
      setSaving(false);
    }
  };

  // Deactivate supplier
  const handleDeactivate = async (id: number, activeName: string) => {
    if (confirm(`¿Estás seguro de desactivar al proveedor "${activeName}"?`)) {
      try {
        const success = await eliminarProveedor(id);
        if (success) {
          toast.success(`Proveedor "${activeName}" desactivado con éxito.`);
          fetchProveedores(currentPage, 10, searchTerm);
        }
      } catch (err: any) {
        toast.error(err.message || "Error al desactivar proveedor.");
      }
    }
  };

  // Toggle active/inactive state quickly
  const handleToggleState = async (proveedor: Proveedor) => {
    try {
      const res = await actualizarProveedor(proveedor.id, {
        estado: !proveedor.estado,
      });
      if (res) {
        toast.success(`Estado del proveedor "${proveedor.nombre}" actualizado.`);
        fetchProveedores(currentPage, 10, searchTerm);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado del proveedor.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/items/compras")}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
          aria-label="Volver a compras"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <PageBreadcrumb pageTitle="Catálogo de Proveedores" />
      </div>

      {/* Action panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Buscar por nombre o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:border-brand-500 focus:bg-white transition-all text-sm outline-none dark:border-gray-800 dark:bg-gray-950 dark:focus:border-brand-500 dark:text-white"
            aria-label="Buscar proveedor por nombre o RUC"
          />
          <MagnifyingGlassIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        </div>

        <Button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none h-11 text-xs font-bold w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </Button>
      </div>

      {/* Supplier Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <svg className="w-10 h-10 animate-spin text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium">Cargando catálogo de proveedores...</span>
          </div>
        ) : proveedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 text-gray-400">
            <UserGroupIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="font-bold text-sm">No se encontraron proveedores</p>
            <p className="text-xs max-w-xs mt-1">Registra proveedores de confianza para asociarlos a tus facturas de compra.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">RUC / Identificación</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Dirección Física</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 font-bold text-sm text-gray-900 dark:text-white">
                      {p.nombre}
                    </td>

                    {/* Tax ID */}
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {p.ruc_nit}
                    </td>

                    {/* Contact Email/Phone */}
                    <td className="px-6 py-4">
                      {p.correo && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">{p.correo}</p>
                      )}
                      {p.telefono && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.telefono}</p>
                      )}
                      {!p.correo && !p.telefono && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">Sin contacto</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {p.direccion || <span className="italic text-gray-500 dark:text-gray-400">Sin dirección</span>}
                    </td>

                    {/* State dot badge */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleState(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          p.estado
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300"
                            : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-400"
                        }`}
                        aria-label={`Cambiar estado de ${p.nombre}. Actual: ${p.estado ? 'Activo' : 'Inactivo'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.estado ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {p.estado ? "Activo" : "Inactivo"}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                        title="Editar Proveedor"
                        aria-label={`Editar proveedor ${p.nombre}`}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {p.estado && (
                        <button
                          onClick={() => handleDeactivate(p.id, p.nombre)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                          title="Desactivar Proveedor"
                          aria-label={`Desactivar proveedor ${p.nombre}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
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
            <span className="text-xs text-gray-400">Total: {total} proveedores</span>
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

      {/* Editor & Creator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-950 rounded-2xl max-w-md w-full border border-gray-150 dark:border-gray-900 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserGroupIcon className="w-5 h-5 text-blue-500" />
                  {editingProveedor ? "Editar Proveedor" : "Registrar Proveedor"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="nombre-comercial-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nombre Comercial *</label>
                    <input
                      id="nombre-comercial-input"
                      type="text"
                      required
                      placeholder="Ej: Computación Mayorista S.A."
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  {/* RUC / TAX ID */}
                  <div>
                    <label htmlFor="ruc-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">RUC / Cédula / Identificación *</label>
                    <input
                      id="ruc-input"
                      type="text"
                      required
                      placeholder="Ej: 1792345678001"
                      value={rucNit}
                      onChange={(e) => setRucNit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Email & Phone side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="correo-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
                      <input
                        id="correo-input"
                        type="email"
                        placeholder="ventas@proveedor.com"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="telefono-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Teléfono</label>
                      <input
                        id="telefono-input"
                        type="text"
                        placeholder="0998765432"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="direccion-textarea" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Dirección Física</label>
                    <textarea
                      id="direccion-textarea"
                      placeholder="Av. 10 de Agosto N34-21 y Rumipamba"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  {/* State Toggle inside form (only on edit mode) */}
                  {editingProveedor && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Habilitar Proveedor:</span>
                      <button
                        type="button"
                        onClick={() => setEstado(!estado)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          estado
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300"
                            : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-450"
                        }`}
                        aria-label={`Habilitar proveedor. Actual: ${estado ? 'Activo' : 'Inactivo'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${estado ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {estado ? "Activo" : "Inactivo"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-900 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/20 -mx-6 -mb-6 p-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="px-5 bg-blue-600 hover:bg-blue-700 text-white border-none text-xs font-bold flex items-center gap-1.5 h-10"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="animate-spin w-4 h-4" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>{editingProveedor ? "Guardar Cambios" : "Guardar Proveedor"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
