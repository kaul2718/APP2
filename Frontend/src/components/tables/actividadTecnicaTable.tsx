'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import ActividadTecnicaDetailsModal from "../modals/ActividadTecnicaDetailsModal";
import ActividadTecnicaEditModal from "../modals/ActividadTecnicaEditModal";
import { toast } from "react-toastify";
import { ActividadTecnica, useActividadTecnica } from "@/hooks/useActividadTecnica";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function ActividadTecnicaTable() {
  const {
    actividades,
    loading,
    setActividades,
    fetchActividades,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleActividadStatus,
  } = useActividadTecnica();

  const [selectedActividad, setSelectedActividad] = useState<ActividadTecnica | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleActividad, setPendingToggleActividad] = useState<ActividadTecnica | null>(null);

  const handleViewClick = (actividad: ActividadTecnica) => {
    setSelectedActividad(actividad);
    setIsModalOpen(true);
  };

  const handleEditClick = (actividad: ActividadTecnica) => {
    setSelectedActividad(actividad);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActividad(null);
  };

  const handleSaveActividad = (actividadActualizada: ActividadTecnica) => {
    setActividades((prev) => prev.map((a) => (a.id === actividadActualizada.id ? actividadActualizada : a)));
    fetchActividades(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (actividad: ActividadTecnica) => {
    setPendingToggleActividad(actividad);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleActividad) return;

    const actividad = pendingToggleActividad;
    const estaActivo = actividad.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleActividadStatus(actividad.id);
      toast.success(`Actividad ${estaActivo ? "deshabilitada" : "habilitada"} correctamente`);
      fetchActividades(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} actividad tecnica:`, error);
      toast.error(`Error al ${accion} actividad tecnica`);
    } finally {
      setPendingToggleActividad(null);
    }
  };

  const columns: ColumnDef<ActividadTecnica>[] = [
    {
      key: "id",
      header: "ID",
      render: (actividad) => actividad.id,
    },
    {
      key: "orden",
      header: "Orden",
      render: (actividad) => `ORD-${actividad.orden.workOrderNumber}`,
    },
    {
      key: "tipoActividad",
      header: "Tipo de Actividad",
      render: (actividad) => actividad.tipoActividad.nombre,
    },
    {
      key: "trabajoRealizado",
      header: "Trabajo Realizado",
      render: (actividad) => actividad.trabajoRealizado,
    },
    {
      key: "fecha",
      header: "Fecha",
      render: (actividad) => format(new Date(actividad.fecha), "dd/MM/yyyy HH:mm", { locale: es }),
    },
    {
      key: "estado",
      header: "Estado",
      render: (actividad) => (
        <Badge size="sm" color={actividad.estado ? "success" : "error"}>
          {actividad.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (actividad: ActividadTecnica): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(actividad),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(actividad),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: actividad.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(actividad),
      className: actividad.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de actividades tecnicas"
        data={actividades}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchActividades(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchActividades(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchActividades(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(actividad) => actividad.id}
      />

      <div className="mt-4">
        <ActividadTecnicaDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          actividad={selectedActividad}
        />
        <ActividadTecnicaEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          actividad={selectedActividad}
          onSave={handleSaveActividad}
        />
        <ConfirmDialog
          isOpen={pendingToggleActividad !== null}
          title="Cambiar estado de actividad tecnica"
          description={
            pendingToggleActividad
              ? `¿Estás seguro de ${pendingToggleActividad.estado ? "deshabilitar" : "habilitar"} esta actividad tecnica?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleActividad(null)}
          confirmText={pendingToggleActividad?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleActividad?.estado ?? false}
        />
      </div>
    </>
  );
}
