'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import TipoManoObraDetailsModal from "../modals/TipoManoObraDetailsModal";
import TipoManoObraEditModal from "../modals/TipoManoObraEditModal";
import { toast } from "react-toastify";
import { TipoManoObra, useTipoManoObra } from "@/hooks/useTipoManoObra";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function TipoManoObraTable() {
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
  } = useTipoManoObra();

  const [selectedTipo, setSelectedTipo] = useState<TipoManoObra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleTipo, setPendingToggleTipo] = useState<TipoManoObra | null>(null);

  const handleViewClick = (tipo: TipoManoObra) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (tipo: TipoManoObra) => {
    setSelectedTipo(tipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipo(null);
  };

  const handleSaveTipo = (tipoActualizado: TipoManoObra) => {
    setTipos((prev) => prev.map((t) => (t.id === tipoActualizado.id ? tipoActualizado : t)));
    fetchTipos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (tipo: TipoManoObra) => {
    setPendingToggleTipo(tipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleTipo) return;

    const tipo = pendingToggleTipo;
    const estaActivo = tipo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleTipoStatus(tipo.id);
      toast.success(`Tipo de mano de obra ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchTipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} tipo de mano de obra:`, error);
      toast.error(`Error al ${accion} tipo de mano de obra`);
    } finally {
      setPendingToggleTipo(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);

  const columns: ColumnDef<TipoManoObra>[] = [
    { key: "id", header: "ID", render: (t) => t.id },
    {
      key: "nombre",
      header: "Nombre",
      render: (t) => (
        <div>
          <span className="block font-medium text-gray-800 dark:text-white/90">{t.nombre}</span>
          {t.descripcion && <span className="block text-xs text-gray-500 dark:text-gray-400">{t.descripcion.substring(0, 50)}...</span>}
        </div>
      ),
    },
    { key: "codigo", header: "Codigo", render: (t) => t.codigo },
    { key: "costo", header: "Costo", render: (t) => formatCurrency(t.costo) },
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

  const rowActions = (tipo: TipoManoObra): ActionDef[] => [
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
        caption="Tabla de tipos de mano de obra"
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
        <TipoManoObraDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} tipo={selectedTipo} />
        <TipoManoObraEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tipo={selectedTipo}
          onSave={handleSaveTipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleTipo !== null}
          title="Cambiar estado de tipo de mano de obra"
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
