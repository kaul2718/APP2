'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import EstadoOrdenDetailsModal from "../modals/EstadoOrdenDetailsModal";
import EstadoOrdenEditModal from "../modals/EstadoOrdenEditModal";
import { toast } from "react-toastify";
import { EstadoOrden, useEstadoOrden } from "@/hooks/useEstadoOrden";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function EstadoOrdenTable() {
  const {
    estadosOrden,
    loading,
    setEstadosOrden,
    fetchEstadosOrden,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleEstadoOrdenStatus,
  } = useEstadoOrden();

  const [selectedEstadoOrden, setSelectedEstadoOrden] = useState<EstadoOrden | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleEstadoOrden, setPendingToggleEstadoOrden] = useState<EstadoOrden | null>(null);

  const handleViewClick = (estadoOrden: EstadoOrden) => {
    setSelectedEstadoOrden(estadoOrden);
    setIsModalOpen(true);
  };

  const handleEditClick = (estadoOrden: EstadoOrden) => {
    setSelectedEstadoOrden(estadoOrden);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEstadoOrden(null);
  };

  const handleSaveEstadoOrden = (estadoOrdenActualizado: EstadoOrden) => {
    setEstadosOrden((prev) => prev.map((e) => (e.id === estadoOrdenActualizado.id ? estadoOrdenActualizado : e)));
    fetchEstadosOrden(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (estadoOrden: EstadoOrden) => {
    setPendingToggleEstadoOrden(estadoOrden);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleEstadoOrden) return;

    const estadoOrden = pendingToggleEstadoOrden;
    const estaActivo = estadoOrden.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleEstadoOrdenStatus(estadoOrden.id);
      fetchEstadosOrden(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} estado de orden:`, error);
      toast.error(`Error al ${accion} estado de orden`);
    } finally {
      setPendingToggleEstadoOrden(null);
    }
  };

  const columns: ColumnDef<EstadoOrden>[] = [
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

  const rowActions = (estadoOrden: EstadoOrden): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(estadoOrden),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(estadoOrden),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: estadoOrden.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(estadoOrden),
      className: estadoOrden.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de estados de orden"
        data={estadosOrden}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchEstadosOrden(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchEstadosOrden(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchEstadosOrden(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(e) => e.id}
      />

      <div className="mt-4">
        <EstadoOrdenDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} estadoOrden={selectedEstadoOrden} />
        <EstadoOrdenEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          estadoOrden={selectedEstadoOrden}
          onSave={handleSaveEstadoOrden}
        />
        <ConfirmDialog
          isOpen={pendingToggleEstadoOrden !== null}
          title="Cambiar estado de orden"
          description={
            pendingToggleEstadoOrden
              ? `¿Estás seguro de ${pendingToggleEstadoOrden.estado ? "deshabilitar" : "habilitar"} el estado de orden \"${pendingToggleEstadoOrden.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleEstadoOrden(null)}
          confirmText={pendingToggleEstadoOrden?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleEstadoOrden?.estado ?? false}
        />
      </div>
    </>
  );
}
