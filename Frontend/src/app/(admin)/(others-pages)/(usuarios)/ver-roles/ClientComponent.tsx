'use client';

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { useRolesPermisos, Rol, Permission } from "@/hooks/useRolesPermisos";
import {
  ShieldCheckIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
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

// Helpers for pretty category names with high-quality Heroicons SVG components
const CATEGORY_MAP: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  orders: { label: "Órdenes", icon: ClipboardDocumentCheckIcon, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  users: { label: "Usuarios", icon: UsersIcon, color: "text-brand-700 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-900/20" },
  roles: { label: "Roles", icon: ShieldCheckIcon, color: "text-amber-800 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/20" },
  permissions: { label: "Permisos", icon: KeyIcon, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  presupuestos: { label: "Presupuestos", icon: BanknotesIcon, color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
  almacen: { label: "Almacén", icon: Square3Stack3DIcon, color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/20" },
  reportes: { label: "Reportes", icon: ChartBarIcon, color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
  notificaciones: { label: "Notificaciones", icon: BellAlertIcon, color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
};

export default function ClientComponent() {
  const {
    roles,
    permissions,
    loading,
    saving,
    createRol,
    updateRol,
    deleteRol,
    createPermission,
    deletePermission,
    togglePermission,
    isSystemRole,
  } = useRolesPermisos();

  const roleNombreId = React.useId();
  const roleSlugId = React.useId();
  const roleDescId = React.useId();
  // UX Layout States
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [roleForm, setRoleForm] = useState({ nombre: "", slug: "", descripcion: "" });

  const [isPermCatalogOpen, setIsPermCatalogOpen] = useState(false);

  // Get currently selected role object
  const activeRole = useMemo(() => {
    if (selectedRoleId === null && roles.length > 0) {
      return roles[0]; // default to first
    }
    return roles.find(r => r.id === selectedRoleId) || roles[0] || null;
  }, [selectedRoleId, roles]);

  // Set default selected role once loaded
  React.useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Unique categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    permissions.forEach(p => {
      const cat = p.slug.split(".")[0];
      if (cat) cats.add(cat);
    });
    return Array.from(cats);
  }, [permissions]);

  // Filtered permissions to display
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                            p.slug.toLowerCase().includes(permissionSearch.toLowerCase());
      
      const cat = p.slug.split(".")[0];
      const matchesCategory = activeCategory === "all" || cat === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [permissions, permissionSearch, activeCategory]);

  // Handle role form submission
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.nombre.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    if (modalMode === "create") {
      if (!roleForm.slug.trim()) {
        toast.error("El slug del rol es requerido");
        return;
      }
      const payload = {
        nombre: roleForm.nombre.trim(),
        slug: roleForm.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        descripcion: roleForm.descripcion.trim(),
      };
      const res = await createRol(payload);
      if (res) {
        setIsRoleModalOpen(false);
        setSelectedRoleId(res.id);
        resetRoleForm();
      }
    } else {
      if (!activeRole) return;
      const payload = {
        nombre: roleForm.nombre.trim(),
        descripcion: roleForm.descripcion.trim(),
      };
      const success = await updateRol(activeRole.id, payload);
      if (success) {
        setIsRoleModalOpen(false);
        resetRoleForm();
      }
    }
  };

  const resetRoleForm = () => {
    setRoleForm({ nombre: "", slug: "", descripcion: "" });
  };

  const openCreateRoleModal = () => {
    setModalMode("create");
    resetRoleForm();
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = () => {
    if (!activeRole) return;
    setModalMode("edit");
    setRoleForm({
      nombre: activeRole.nombre,
      slug: activeRole.slug,
      descripcion: activeRole.descripcion || "",
    });
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!activeRole) return;
    if (isSystemRole(activeRole.slug)) {
      toast.error("No se pueden eliminar los roles esenciales del sistema");
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el rol "${activeRole.nombre}"?`)) {
      const idx = roles.findIndex(r => r.id === activeRole.id);
      const success = await deleteRol(activeRole.id);
      if (success) {
        // select another role
        const nextRole = roles[idx === 0 ? 1 : idx - 1] || null;
        setSelectedRoleId(nextRole ? nextRole.id : null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Accesos, Roles y Permisos" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando la matriz de seguridad...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR: Roles Selection list */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-brand-500" />
                  Roles Disponibles
                </h2>
                <Button
                  size="sm"
                  onClick={openCreateRoleModal}
                  className="flex items-center gap-1.5"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  <span>Nuevo Rol</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                {roles.map((role) => {
                  const isSelected = activeRole?.id === role.id;
                  const totalActivePerms = role.rolePermissions?.length || 0;

                  return (
                    <motion.button
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                        isSelected
                          ? "bg-brand-500/10 border-brand-500 text-brand-900 dark:text-brand-300 font-semibold"
                          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      <div className="space-y-1 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-sm group-hover:text-brand-500 transition-colors">
                            {role.nombre}
                          </span>
                          {isSystemRole(role.slug) && (
                            <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              Sistema
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {role.descripcion || "Sin descripción"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 z-10">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? "bg-brand-500 text-white"
                            : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}>
                          {totalActivePerms} perms
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-tr from-brand-600/90 to-brand-500/95 text-white rounded-2xl p-5 shadow-md space-y-4">
              <div className="space-y-1">
                <h2 className="font-bold text-sm uppercase tracking-wide">Permisos del Sistema</h2>
                <p className="text-xs text-brand-100">
                  ¿Necesitas una nueva acción en el sistema? Puedes extender el catálogo global de permisos.
                </p>
              </div>
              <button
                onClick={() => setIsPermCatalogOpen(true)}
                className="w-full bg-white text-brand-600 py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <FolderOpenIcon className="w-4 h-4" />
                Catálogo de Permisos
              </button>
            </div>
          </div>

          {/* RIGHT WORKSPACE: Interactive detailed selected role permissions list */}
          <div className="lg:col-span-8">
            {activeRole ? (
              <motion.div
                layoutId="workspace"
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
              >
                {/* Header Role Summary */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
                        <ShieldCheckIcon className="w-6 h-6" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {activeRole.nombre}
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 font-normal bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                            {activeRole.slug}
                          </span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activeRole.descripcion || "Este rol no tiene una descripción detallada registrada."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button variant="outline" size="sm" onClick={openEditRoleModal}>
                      <PencilSquareIcon className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    {!isSystemRole(activeRole.slug) && (
                      <button
                        onClick={handleDeleteRole}
                        className="py-2 px-3 border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs font-bold transition-all"
                        title="Eliminar este Rol"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search and Categories Quick-Filters */}
                <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 space-y-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar permisos por nombre o slug..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      aria-label="Buscar permisos por nombre o slug"
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all border border-transparent"
                    />
                  </div>

                  {/* Horizontal Scrollable categories tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeCategory === "all"
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      <span>Todos ({permissions.length})</span>
                    </button>
                    {categories.map((cat) => {
                      const catInfo = CATEGORY_MAP[cat] || { label: cat, icon: KeyIcon };
                      const IconComponent = catInfo.icon;
                      const count = permissions.filter(p => p.slug.startsWith(`${cat}.`)).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            activeCategory === cat
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <span>{catInfo.label}</span>
                          <span className="text-xs font-normal opacity-90">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Permissions Grid/List Workspace */}
                <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {filteredPermissions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPermissions.map((perm) => {
                        const hasPerm = activeRole.rolePermissions?.some(
                          (rp) => rp.permissionId === perm.id
                        ) || false;
                        const parts = perm.slug.split(".");
                        const cat = parts[0];
                        const catInfo = CATEGORY_MAP[cat] || {
                          icon: KeyIcon,
                          color: "text-gray-500",
                          bg: "bg-gray-50",
                        };
                        const PermIcon = catInfo.icon;

                        return (
                          <motion.div
                            key={perm.id}
                            layout
                            className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3 hover:shadow-sm ${
                              hasPerm
                                ? "bg-white dark:bg-gray-900 border-brand-500/30"
                                : "bg-gray-50/40 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800/80"
                            }`}
                          >
                             {/* Toggle Switch */}
                            <button
                              onClick={() => togglePermission(activeRole.id, perm.id)}
                              aria-label={`Permiso ${perm.nombre}`}
                              aria-checked={hasPerm}
                              role="switch"
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all focus:outline-none mt-1 ${
                                hasPerm
                                  ? "bg-brand-500 hover:bg-brand-600 shadow-sm"
                                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  hasPerm ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <PermIcon className={`w-4.5 h-4.5 ${catInfo.color}`} />
                                <span className="text-sm font-bold text-gray-800 dark:text-white">
                                  {perm.nombre}
                                </span>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${catInfo.bg} ${catInfo.color}`}>
                                  {cat}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                {perm.descripcion || "Permite realizar acciones asociadas al módulo."}
                              </p>
                              <span className="block text-xs font-mono text-gray-500 dark:text-gray-400">
                                {perm.slug}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2">
                      <FolderOpenIcon className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="text-sm font-medium text-gray-400">
                        No se encontraron permisos para esta búsqueda o filtro.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center space-y-4">
                <FolderOpenIcon className="w-16 h-16 text-gray-200 dark:text-gray-800 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Ningún rol disponible</h3>
                  <p className="text-sm text-gray-400">Crea un rol en la barra lateral para empezar a configurar accesos.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Creation / Modification Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={modalMode === "create" ? "Crear Nuevo Rol" : "Editar Información del Rol"}
        className="max-w-[500px]"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-brand-500" />
            {modalMode === "create" ? "Crear Nuevo Rol" : "Editar Información del Rol"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Completa los campos básicos. Los slugs de roles existentes no se pueden modificar.
          </p>

          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div>
              <Label htmlFor={roleNombreId}>Nombre del Rol *</Label>
              <Input
                id={roleNombreId}
                value={roleForm.nombre}
                onChange={(e) => setRoleForm({ ...roleForm, nombre: e.target.value })}
                placeholder="Ej: Supervisor de Soporte"
                required
              />
            </div>

            <div>
              <Label htmlFor={roleSlugId}>Slug identificador *</Label>
              <Input
                id={roleSlugId}
                value={roleForm.slug}
                onChange={(e) =>
                  setRoleForm({
                    ...roleForm,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="Ej: supervisor-soporte"
                disabled={modalMode === "edit"}
                required
              />
              {modalMode === "create" && (
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                  Slug generado: {roleForm.slug || "ninguno"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={roleDescId}>Descripción breve</Label>
              <textarea
                id={roleDescId}
                value={roleForm.descripcion}
                onChange={(e) => setRoleForm({ ...roleForm, descripcion: e.target.value })}
                placeholder="Describe las responsabilidades del rol..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} loading={saving}>
                {modalMode === "create" ? "Registrar Rol" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Permission Catalog Modal Drawer */}
      <AnimatePresence>
        {isPermCatalogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[600px] h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-6 h-6 text-brand-500" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Catálogo de Permisos
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total: {permissions.length} permisos registrados</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPermCatalogOpen(false)}
                  aria-label="Cerrar catálogo"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Catalog Items list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {permissions.map((perm) => {
                    const parts = perm.slug.split(".");
                    const cat = parts[0] || "otro";
                    const catInfo = CATEGORY_MAP[cat] || { icon: KeyIcon, color: "text-gray-600" };
                    const ItemIcon = catInfo.icon;

                    return (
                      <div key={perm.id} className="py-3 flex items-start justify-between gap-4 group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ItemIcon className={`w-4 h-4 ${catInfo.color}`} />
                            <span className="text-sm font-semibold text-gray-850 dark:text-white">
                              {perm.nombre}
                            </span>
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              {perm.slug}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {perm.descripcion || "Permite ejecutar la acción asociada en el módulo respectivo."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
                <Button variant="outline" onClick={() => setIsPermCatalogOpen(false)}>
                  Cerrar Catálogo
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
