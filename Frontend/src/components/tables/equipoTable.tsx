'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import EquipoDetailsModal from "../modals/EquipoDetailsModal";
import EquipoEditModal from "../modals/EquipoEditModal";
import { toast } from "react-toastify";
import { Equipo, useEquipos } from "@/hooks/useEquipos";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function EquipoTable() {
  const {
    equipos,
    loading,
    setEquipos,
    fetchEquipos,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleEstado,
  } = useEquipos();

  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleEquipo, setPendingToggleEquipo] = useState<Equipo | null>(null);

  const handleViewClick = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  const handleSaveEquipo = (equipoActualizado: Equipo) => {
    setEquipos((prev) => prev.map((e) => (e.id === equipoActualizado.id ? equipoActualizado : e)));
    fetchEquipos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (equipo: Equipo) => {
    setPendingToggleEquipo(equipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleEquipo) return;

    const equipo = pendingToggleEquipo;
    const estaActivo = equipo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleEstado(equipo);
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} equipo:`, error);
      toast.error(error instanceof Error ? error.message : `Error al ${accion} equipo`);
    } finally {
      setPendingToggleEquipo(null);
    }
  };

  const columns: ColumnDef<Equipo>[] = [
    {
      key: "id",
      header: "ID",
      render: (equipo) => equipo.id,
    },
    {
      key: "numeroSerie",
      header: "N Serie",
      render: (equipo) => equipo.numeroSerie,
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (equipo) => equipo.tipoEquipo?.nombre || "Sin tipo",
    },
    {
      key: "marca",
      header: "Marca",
      render: (equipo) => equipo.marca?.nombre || "Sin marca",
    },
    {
      key: "modelo",
      header: "Modelo",
      render: (equipo) => equipo.modelo?.nombre || "Sin modelo",
    },
    {
      key: "estado",
      header: "Estado",
      render: (equipo) => (
        <Badge size="sm" color={equipo.estado ? "success" : "error"}>
          {equipo.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (equipo: Equipo): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(equipo),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(equipo),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: equipo.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(equipo),
      className: equipo.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de equipos"
        data={equipos}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchEquipos(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchEquipos(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchEquipos(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(equipo) => equipo.id}
      />

      <div className="mt-4">
        <EquipoDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          equipo={selectedEquipo}
        />
        <EquipoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          equipo={selectedEquipo}
          onSave={handleSaveEquipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleEquipo !== null}
          title="Cambiar estado de equipo"
          description={
            pendingToggleEquipo
              ? `¿Estás seguro de ${pendingToggleEquipo.estado ? "deshabilitar" : "habilitar"} el equipo \"${pendingToggleEquipo.numeroSerie}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleEquipo(null)}
          confirmText={pendingToggleEquipo?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleEquipo?.estado ?? false}
        />
      </div>
    </>
  );
}
