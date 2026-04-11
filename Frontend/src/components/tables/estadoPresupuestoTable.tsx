'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import EstadoPresupuestoDetailsModal from "../modals/EstadoPresupuestoDetailsModal";
import EstadoPresupuestoEditModal from "../modals/EstadoPresupuestoEditModal";
import { toast } from "react-toastify";
import { EstadoPresupuesto, useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function EstadoPresupuestoTable() {
  const {
    estados,
    loading,
    setEstados,
    fetchEstados,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleEstadoPresupuestoStatus,
  } = useEstadoPresupuesto();

  const [selectedEstado, setSelectedEstado] = useState<EstadoPresupuesto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleEstado, setPendingToggleEstado] = useState<EstadoPresupuesto | null>(null);

  const handleViewClick = (estado: EstadoPresupuesto) => {
    setSelectedEstado(estado);
    setIsModalOpen(true);
  };

  const handleEditClick = (estado: EstadoPresupuesto) => {
    setSelectedEstado(estado);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEstado(null);
  };

  const handleSaveEstado = (estadoActualizado: EstadoPresupuesto) => {
    setEstados((prev) => prev.map((e) => (e.id === estadoActualizado.id ? estadoActualizado : e)));
    fetchEstados(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (estado: EstadoPresupuesto) => {
    setPendingToggleEstado(estado);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleEstado) return;

    const estado = pendingToggleEstado;
    const estaActivo = estado.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleEstadoPresupuestoStatus(estado.id);
      toast.success(`Estado de presupuesto ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchEstados(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} estado de presupuesto:`, error);
      toast.error(`Error al ${accion} estado de presupuesto`);
    } finally {
      setPendingToggleEstado(null);
    }
  };

  const columns: ColumnDef<EstadoPresupuesto>[] = [
    { key: "id", header: "ID", render: (e) => e.id },
    { key: "nombre", header: "Nombre", render: (e) => e.nombre },
    { key: "descripcion", header: "Descripcion", render: (e) => e.descripcion || "Sin descripcion" },
    {
      key: "estado",
      header: "Estado",
      render: (e) => (
        <Badge size="sm" color={e.estado ? "success" : "error"}>
          {e.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (estado: EstadoPresupuesto): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(estado),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(estado),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: estado.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(estado),
      className: estado.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de estados de presupuesto"
        data={estados}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchEstados(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchEstados(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchEstados(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(e) => e.id}
      />

      <div className="mt-4">
        <EstadoPresupuestoDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} estado={selectedEstado} />
        <EstadoPresupuestoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          estado={selectedEstado}
          onSave={handleSaveEstado}
        />
        <ConfirmDialog
          isOpen={pendingToggleEstado !== null}
          title="Cambiar estado de presupuesto"
          description={
            pendingToggleEstado
              ? `¿Estás seguro de ${pendingToggleEstado.estado ? "deshabilitar" : "habilitar"} el estado \"${pendingToggleEstado.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleEstado(null)}
          confirmText={pendingToggleEstado?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleEstado?.estado ?? false}
        />
      </div>
    </>
  );
}
