'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import TipoActividadTecnicaDetailsModal from "../modals/TipoActividadTecnicaDetailsModal";
import TipoActividadTecnicaEditModal from "../modals/TipoActividadTecnicaEditModal";
import { toast } from "react-toastify";
import { TipoActividadTecnica, useTipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function TipoActividadTecnicaTable() {
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
    toggleTipoActividadStatus,
  } = useTipoActividadTecnica();

  const [selectedTipo, setSelectedTipo] = useState<TipoActividadTecnica | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleTipoActividad, setPendingToggleTipoActividad] = useState<TipoActividadTecnica | null>(null);

  const handleViewClick = (tipo: TipoActividadTecnica) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (tipo: TipoActividadTecnica) => {
    setSelectedTipo(tipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipo(null);
  };

  const handleSaveTipo = (tipoActualizado: TipoActividadTecnica) => {
    setTipos((prev) => prev.map((t) => (t.id === tipoActualizado.id ? tipoActualizado : t)));
    fetchTipos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (tipo: TipoActividadTecnica) => {
    setPendingToggleTipoActividad(tipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleTipoActividad) return;

    const tipo = pendingToggleTipoActividad;
    const estaActivo = tipo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleTipoActividadStatus(tipo.id);
      toast.success(`Tipo de actividad tecnica ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchTipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} tipo de actividad tecnica:`, error);
      toast.error(`Error al ${accion} tipo de actividad tecnica`);
    } finally {
      setPendingToggleTipoActividad(null);
    }
  };

  const columns: ColumnDef<TipoActividadTecnica>[] = [
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

  const rowActions = (tipo: TipoActividadTecnica): ActionDef[] => [
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
        caption="Tabla de tipos de actividad tecnica"
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
        <TipoActividadTecnicaDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} tipo={selectedTipo} />
        <TipoActividadTecnicaEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tipo={selectedTipo}
          onSave={handleSaveTipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleTipoActividad !== null}
          title="Cambiar estado de tipo de actividad"
          description={
            pendingToggleTipoActividad
              ? `¿Estás seguro de ${pendingToggleTipoActividad.estado ? "deshabilitar" : "habilitar"} el tipo \"${pendingToggleTipoActividad.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleTipoActividad(null)}
          confirmText={pendingToggleTipoActividad?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleTipoActividad?.estado ?? false}
        />
      </div>
    </>
  );
}
