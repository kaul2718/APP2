'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import UsuarioDetailsModal from "../modals/UsuarioDetailsModal";
import UsuarioEditModal from "../modals/UsuarioEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Usuario, useUsuario, UseUsuarioReturn } from "@/hooks/useUsuario";
import { useRoles } from "@/hooks/useRoles";
import { ActionDef, ColumnDef, DataTable } from "./DataTable";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ArrowPathIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  UserIcon
} from "@heroicons/react/24/outline";

interface UsuarioNuevoTableProps {
  usuarioHook?: UseUsuarioReturn;
}

export default function UsuarioNuevoTable({
  usuarioHook: propsHook,
}: UsuarioNuevoTableProps) {
  const internalHook = useUsuario();
  const hook = propsHook || internalHook;
  
  const {
    usuarios,
    loading,
    setUsuarios,
    fetchUsuarios,
    deleteUsuario,
    restoreUsuario,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    roleFilter,
    setRoleFilter,
    toggleUsuarioStatus,
    refetch,
  } = hook;

  const { roles } = useRoles();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const token = session?.accessToken || "";
  const isAdmin = session?.user?.role === "admin";

  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleUsuario, setPendingToggleUsuario] = useState<Usuario | null>(null);
  const [pendingDeleteUsuario, setPendingDeleteUsuario] = useState<Usuario | null>(null);
  const [pendingRestoreUsuario, setPendingRestoreUsuario] = useState<Usuario | null>(null);

  const handleViewClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleEditClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(null);
  };

  const handleSaveUsuario = (usuarioActualizado: Usuario) => {
    setUsuarios((prev) => prev.map((u) => (u.id === usuarioActualizado.id ? usuarioActualizado : u)));
    refetch();
  };

  const handleToggleEstado = (usuario: Usuario) => {
    setPendingToggleUsuario(usuario);
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setPendingDeleteUsuario(usuario);
  };

  const handleRestoreClick = (usuario: Usuario) => {
    setPendingRestoreUsuario(usuario);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleUsuario) return;

    const usuario = pendingToggleUsuario;
    try {
      await toggleUsuarioStatus(usuario.id);
    } catch (error) {
      console.error(`Error al cambiar estado del usuario:`, error);
    } finally {
      setPendingToggleUsuario(null);
    }
  };

  const confirmDeleteUsuario = async () => {
    if (!pendingDeleteUsuario) return;

    try {
      await deleteUsuario(pendingDeleteUsuario.id);
    } finally {
      setPendingDeleteUsuario(null);
    }
  };

  const confirmRestoreUsuario = async () => {
    if (!pendingRestoreUsuario) return;

    try {
      await restoreUsuario(pendingRestoreUsuario.id);
    } finally {
      setPendingRestoreUsuario(null);
    }
  };

  const columns: ColumnDef<Usuario>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (usuario) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{usuario.cedula}</p>
          </div>
        </div>
      ),
    },
    {
      key: "correo",
      header: "Contacto",
      render: (usuario) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-700 dark:text-gray-300">{usuario.correo}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{usuario.telefono}</span>
        </div>
      ),
    },
    {
      key: "rol",
      header: "Rol",
      render: (usuario) => {
        const rolNombre = roles.find((r) => r.slug === usuario.role)?.nombre || String(usuario.role);
        return (
          <Badge size="sm" color="primary">
            {rolNombre}
          </Badge>
        );
      },
    },
    {
      key: "estado",
      header: "Estado",
      render: (usuario) => (
        <Badge size="sm" variant="light" color={usuario.estado ? "success" : "error"}>
          {usuario.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const actions = (usuario: Usuario): ActionDef[] => {
    const isDeleted = Boolean(usuario.deletedAt);

    const items: ActionDef[] = [
      {
        key: "view",
        label: <EyeIcon className="h-4 w-4" />,
        text: "Ver detalles",
        onClick: () => handleViewClick(usuario),
        className:
          "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
      },
    ];

    if (!isDeleted && hasPermission("users.update")) {
      items.push(
        {
          key: "edit",
          label: <PencilSquareIcon className="h-4 w-4" />,
          text: "Editar usuario",
          onClick: () => handleEditClick(usuario),
          className:
            "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
        },
        {
          key: "toggle",
          label: usuario.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
          text: usuario.estado ? "Deshabilitar" : "Habilitar",
          onClick: () => handleToggleEstado(usuario),
          className: usuario.estado
            ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
        }
      );
    }

    if (hasPermission("users.delete")) {
      if (isDeleted) {
        items.push({
          key: "restore",
          label: <ArrowPathIcon className="h-4 w-4" />,
          text: "Restaurar",
          onClick: () => handleRestoreClick(usuario),
          className:
            "flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors",
        });
      } else {
        items.push({
          key: "delete",
          label: <TrashIcon className="h-4 w-4" />,
          text: "Eliminar",
          onClick: () => handleDeleteClick(usuario),
          className:
            "flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-colors",
        });
      }
    }

    return items;
  };

  return (
    <>
      <DataTable
        caption="Tabla de usuarios"
        data={usuarios}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          fetchUsuarios(1, 10, value, showInactive, roleFilter);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const next = !showInactive;
          setShowInactive(next);
          fetchUsuarios(1, 10, searchTerm, next, roleFilter);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchUsuarios(page, 10, searchTerm, showInactive, roleFilter)}
        actions={actions}
        getRowKey={(usuario) => usuario.id}
      />

      <UsuarioDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        usuario={selectedUsuario}
      />
      <UsuarioEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        usuario={selectedUsuario}
        onSave={handleSaveUsuario}
      />
      <ConfirmDialog
        isOpen={pendingToggleUsuario !== null}
        title="Cambiar estado de usuario"
        description={
          pendingToggleUsuario
            ? `¿Estás seguro de ${pendingToggleUsuario.estado ? "deshabilitar" : "habilitar"} al usuario \"${pendingToggleUsuario.nombre} ${pendingToggleUsuario.apellido}\"?`
            : ""
        }
        onConfirm={confirmToggleEstado}
        onClose={() => setPendingToggleUsuario(null)}
        confirmText={pendingToggleUsuario?.estado ? "Deshabilitar" : "Habilitar"}
        destructive={pendingToggleUsuario?.estado ?? false}
      />
      <ConfirmDialog
        isOpen={pendingDeleteUsuario !== null}
        title="Eliminar usuario"
        description={
          pendingDeleteUsuario
            ? `¿Deseas eliminar lógicamente al usuario \"${pendingDeleteUsuario.nombre} ${pendingDeleteUsuario.apellido}\"? Podrás restaurarlo después.`
            : ""
        }
        onConfirm={confirmDeleteUsuario}
        onClose={() => setPendingDeleteUsuario(null)}
        confirmText="Eliminar"
        destructive
      />
      <ConfirmDialog
        isOpen={pendingRestoreUsuario !== null}
        title="Restaurar usuario"
        description={
          pendingRestoreUsuario
            ? `¿Deseas restaurar al usuario \"${pendingRestoreUsuario.nombre} ${pendingRestoreUsuario.apellido}\"?`
            : ""
        }
        onConfirm={confirmRestoreUsuario}
        onClose={() => setPendingRestoreUsuario(null)}
        confirmText="Restaurar"
      />
    </>
  );
}