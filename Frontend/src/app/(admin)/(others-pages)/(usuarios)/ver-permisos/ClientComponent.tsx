'use client';

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { useRolesPermisos, Permission } from "@/hooks/useRolesPermisos";
import {
  KeyIcon,
  PlusCircleIcon,
  TrashIcon,
  FolderOpenIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ServerIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  BanknotesIcon,
  Square3Stack3DIcon,
  ChartBarIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

// Mapping category slugs to details & SVG icons from library
const CATEGORY_MAP: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  orders: { label: "Órdenes", icon: ClipboardDocumentCheckIcon, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  users: { label: "Usuarios", icon: UsersIcon, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-900/20" },
  roles: { label: "Roles", icon: ShieldCheckIcon, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
  permissions: { label: "Permisos", icon: KeyIcon, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  presupuestos: { label: "Presupuestos", icon: BanknotesIcon, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
  almacen: { label: "Almacén", icon: Square3Stack3DIcon, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
  reportes: { label: "Reportes", icon: ChartBarIcon, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
  notificaciones: { label: "Notificaciones", icon: BellAlertIcon, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
};

export default function ClientComponent() {
  const {
    permissions,
    loading,
    saving,
    createPermission,
    deletePermission,
  } = useRolesPermisos();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPerm, setNewPerm] = useState({ nombre: "", slug: "", descripcion: "" });

  // Unique categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    permissions.forEach(p => {
      const cat = p.slug.split(".")[0];
      if (cat) cats.add(cat);
    });
    return Array.from(cats);
  }, [permissions]);

  // Filtered list
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = p.slug.split(".")[0];
      const matchesCategory = activeCategory === "all" || cat === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [permissions, searchQuery, activeCategory]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = permissions.length;
    const custom = permissions.filter(p => p.id > 21).length;
    const system = total - custom;
    return { total, custom, system };
  }, [permissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerm.nombre.trim() || !newPerm.slug.trim()) {
      toast.error("El nombre y slug son obligatorios");
      return;
    }

    const payload = {
      nombre: newPerm.nombre.trim(),
      slug: newPerm.slug.trim().toLowerCase(),
      descripcion: newPerm.descripcion.trim(),
    };

    const res = await createPermission(payload);
    if (res) {
      setIsCreateModalOpen(false);
      setNewPerm({ nombre: "", slug: "", descripcion: "" });
    }
  };

  const handleDelete = async (perm: Permission) => {
    if (window.confirm(`¿Estás completamente seguro de eliminar el permiso "${perm.nombre}"? Esto lo revocaría automáticamente de todos los roles.`)) {
      await deletePermission(perm.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Catálogo de Permisos" />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={<KeyIcon className="w-6 h-6 text-brand-500" />}
          label="Total Permisos"
          value={stats.total}
          delay={0.1}
        />
        <StatCard
          icon={<ServerIcon className="w-6 h-6 text-emerald-500" />}
          label="Permisos del Sistema"
          value={stats.system}
          delay={0.2}
        />
        <StatCard
          icon={<ShieldCheckIcon className="w-6 h-6 text-amber-500" />}
          label="Permisos Personalizados"
          value={stats.custom}
          delay={0.3}
        />
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o identificador (slug)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all border border-transparent"
          />
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-brand-500/20"
            size="md"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Nuevo Permiso
          </Button>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando el catálogo de permisos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Categories Tab Selector (Left on large, top on small) */}
          <div className="lg:col-span-3 space-y-2 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Filtrar por Módulo</h4>
            <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-1 lg:pb-0">
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-between ${
                  activeCategory === "all"
                    ? "bg-brand-500 text-white font-semibold shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Todos</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeCategory === "all" ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{permissions.length}</span>
              </button>
              {categories.map((cat) => {
                const catInfo = CATEGORY_MAP[cat] || { label: cat, icon: KeyIcon, color: "text-gray-600", bg: "bg-gray-50" };
                const IconComponent = catInfo.icon;
                const count = permissions.filter(p => p.slug.startsWith(`${cat}.`)).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-between ${
                      activeCategory === cat
                        ? "bg-brand-500 text-white font-semibold shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <span>{catInfo.label}</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeCategory === cat ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions Cards Grid */}
          <div className="lg:col-span-9">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              {filteredPermissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPermissions.map((perm) => {
                    const parts = perm.slug.split(".");
                    const cat = parts[0] || "otro";
                    const catInfo = CATEGORY_MAP[cat] || {
                      label: cat,
                      icon: KeyIcon,
                      color: "text-gray-500",
                      bg: "bg-gray-50 dark:bg-gray-800/60",
                    };
                    const CardIcon = catInfo.icon;

                    return (
                      <motion.div
                        key={perm.id}
                        layout
                        className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-800/10 hover:shadow-sm transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <CardIcon className={`w-4.5 h-4.5 ${catInfo.color}`} />
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-brand-500 transition-colors">
                                  {perm.nombre}
                                </h4>
                              </div>
                              <span className="inline-block text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-1.5 py-0.5 rounded">
                                {perm.slug}
                              </span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${catInfo.bg} ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            {perm.descripcion || "Permite realizar las acciones asociadas en el respectivo módulo."}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">
                            {perm.id <= 21 ? "🔒 Sistema" : "🔧 Personalizado"}
                          </span>
                          {perm.id > 21 && (
                            <button
                              onClick={() => handleDelete(perm)}
                              className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                              title="Eliminar Permiso"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FolderOpenIcon className="w-12 h-12 text-gray-300 mx-auto" />
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No se encontraron permisos</h4>
                  <p className="text-xs text-gray-400">Ajusta tu búsqueda o selecciona otra categoría.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permission Creation Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[450px] overflow-hidden rounded-3xl bg-white p-6 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-6 h-6 text-brand-500" />
                Registrar Nuevo Permiso
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Agrega una nueva capacidad al sistema. Utiliza el estándar "modulo.accion" para mantener el orden.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nombre del Permiso *</Label>
                  <Input
                    value={newPerm.nombre}
                    onChange={(e) => setNewPerm({ ...newPerm, nombre: e.target.value })}
                    placeholder="Ej: Registrar Compras"
                    required
                  />
                </div>

                <div>
                  <Label>Slug Identificador (Slug) *</Label>
                  <Input
                    value={newPerm.slug}
                    onChange={(e) =>
                      setNewPerm({
                        ...newPerm,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, ""),
                      })
                    }
                    placeholder="Ej: almacen.compras"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1 flex items-start gap-1 font-medium">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    Estándar sugerido: modulo.accion (ej. reportes.eliminar)
                  </p>
                </div>

                <div>
                  <Label>Descripción del Permiso</Label>
                  <textarea
                    value={newPerm.descripcion}
                    onChange={(e) => setNewPerm({ ...newPerm, descripcion: e.target.value })}
                    placeholder="Describe exactamente qué capacidad otorga este permiso..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} loading={saving}>
                    Crear Permiso
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

function StatCard({ icon, label, value, delay }: { icon: React.ReactNode, label: string, value: number, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all"
    >
      <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</h3>
      </div>
    </motion.div>
  );
}
