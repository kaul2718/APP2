'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import UsuarioDetailsModal from "../modals/UsuarioDetailsModal";
import UsuarioEditModal from "../modals/UsuarioEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Usuario, useUsuario } from "@/hooks/useUsuario";
import { useRoles } from "@/hooks/useRoles";
import { ActionDef, ColumnDef, DataTable } from "./DataTable";

export default function UsuarioNuevoTable() {
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
  } = useUsuario();

  const { roles } = useRoles();
  const { data: session } = useSession();
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
    fetchUsuarios(currentPage, 10, searchTerm, showInactive);
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
    const estaActivo = usuario.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${usuario.id}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Usuario ${estaActivo ? 'deshabilitado' : 'habilitado'} correctamente`);
      fetchUsuarios(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} usuario:`, error);
      toast.error(`Error al ${accion} usuario`);
    } finally {
      setPendingToggleUsuario(null);
    }
  };

  const confirmDeleteUsuario = async () => {
    if (!pendingDeleteUsuario) return;

    try {
      const ok = await deleteUsuario(pendingDeleteUsuario.id);
      if (ok) {
        fetchUsuarios(currentPage, 10, searchTerm, showInactive);
      }
    } finally {
      setPendingDeleteUsuario(null);
    }
  };

  const confirmRestoreUsuario = async () => {
    if (!pendingRestoreUsuario) return;

    try {
      const ok = await restoreUsuario(pendingRestoreUsuario.id);
      if (ok) {
        fetchUsuarios(currentPage, 10, searchTerm, showInactive);
      }
    } finally {
      setPendingRestoreUsuario(null);
    }
  };

  const columns: ColumnDef<Usuario>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (usuario) => `${usuario.nombre} ${usuario.apellido}`,
    },
    {
      key: "cedula",
      header: "Cédula",
      render: (usuario) => usuario.cedula,
    },
    {
      key: "correo",
      header: "Correo",
      render: (usuario) => usuario.correo,
    },
    {
      key: "telefono",
      header: "Teléfono",
      render: (usuario) => usuario.telefono,
    },
    {
      key: "rol",
      header: "Rol",
      render: (usuario) => roles.find((r) => r.slug === usuario.role)?.nombre || String(usuario.role),
    },
    {
      key: "estado",
      header: "Estado",
      render: (usuario) => (
        <Badge size="sm" color={usuario.estado ? "success" : "error"}>
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
        label: "Ver",
        onClick: () => handleViewClick(usuario),
        className:
          "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
      },
    ];

    if (!isDeleted) {
      items.push(
        {
          key: "edit",
          label: "Editar",
          onClick: () => handleEditClick(usuario),
          className:
            "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
        },
        {
          key: "toggle",
          label: usuario.estado ? "Deshabilitar" : "Habilitar",
          onClick: () => handleToggleEstado(usuario),
          className: usuario.estado
            ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
            : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
        }
      );
    }

    if (isAdmin) {
      if (isDeleted) {
        items.push({
          key: "restore",
          label: "Restaurar",
          onClick: () => handleRestoreClick(usuario),
          className:
            "rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20",
        });
      } else {
        items.push({
          key: "delete",
          label: "Eliminar",
          onClick: () => handleDeleteClick(usuario),
          className:
            "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20",
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
          fetchUsuarios(1, 10, value, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const next = !showInactive;
          setShowInactive(next);
          fetchUsuarios(1, 10, searchTerm, next);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchUsuarios(page, 10, searchTerm, showInactive)}
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