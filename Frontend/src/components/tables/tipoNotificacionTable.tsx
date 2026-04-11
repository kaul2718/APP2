'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import TipoNotificacionDetailsModal from "../modals/TipoNotificacionDetailsModal";
import TipoNotificacionEditModal from "../modals/TipoNotificacionEditModal";
import { toast } from "react-toastify";
import { TipoNotificacion, useTipoNotificacion } from "@/hooks/useTipoNotificacion";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function TipoNotificacionTable() {
  const {
    tipos,
    loading,
    setTipos,
    fetchTipos,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleTipoStatus,
  } = useTipoNotificacion();

  const [selectedTipo, setSelectedTipo] = useState<TipoNotificacion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleTipo, setPendingToggleTipo] = useState<TipoNotificacion | null>(null);

  const handleViewClick = (tipo: TipoNotificacion) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (tipo: TipoNotificacion) => {
    setSelectedTipo(tipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipo(null);
  };

  const handleSaveTipo = (tipoActualizado: TipoNotificacion) => {
    setTipos((prev) => prev.map((t) => (t.id === tipoActualizado.id ? tipoActualizado : t)));
    fetchTipos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (tipo: TipoNotificacion) => {
    setPendingToggleTipo(tipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleTipo) return;

    const tipo = pendingToggleTipo;
    const estaActivo = tipo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleTipoStatus(tipo.id);
      toast.success(`Tipo de notificacion ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchTipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} tipo de notificacion:`, error);
      toast.error(`Error al ${accion} tipo de notificacion`);
    } finally {
      setPendingToggleTipo(null);
    }
  };

  const columns: ColumnDef<TipoNotificacion>[] = [
    { key: "id", header: "ID", render: (t) => t.id },
    { key: "nombre", header: "Nombre", render: (t) => t.nombre },
    { key: "descripcion", header: "Descripcion", render: (t) => t.descripcion || "Sin descripcion" },
    {
      key: "estado",
      header: "Estado",
      render: (t) => (
        <Badge size="sm" color={t.estado ? "success" : "error"}>
          {t.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (tipo: TipoNotificacion): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(tipo),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(tipo),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: tipo.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(tipo),
      className: tipo.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de tipos de notificacion"
        data={tipos}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchTipos(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchTipos(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchTipos(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(t) => t.id}
      />

      <div className="mt-4">
        <TipoNotificacionDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} tipo={selectedTipo} />
        <TipoNotificacionEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tipo={selectedTipo}
          onSave={handleSaveTipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleTipo !== null}
          title="Cambiar estado de tipo de notificacion"
          description={
            pendingToggleTipo
              ? `¿Estás seguro de ${pendingToggleTipo.estado ? "deshabilitar" : "habilitar"} el tipo \"${pendingToggleTipo.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleTipo(null)}
          confirmText={pendingToggleTipo?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleTipo?.estado ?? false}
        />
      </div>
    </>
  );
}
