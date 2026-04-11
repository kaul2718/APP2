'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import TipoEquipoDetailsModal from "../modals/TipoEquipoDetailsModal";
import TipoEquipoEditModal from "../modals/TipoEquipoEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { TipoEquipo, useTipoEquipo } from "@/hooks/useTipoEquipo";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function TipoEquipoTable() {
  const {
    tiposEquipo,
    loading,
    fetchTiposEquipo,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
  } = useTipoEquipo();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedTipoEquipo, setSelectedTipoEquipo] = useState<TipoEquipo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleTipoEquipo, setPendingToggleTipoEquipo] = useState<TipoEquipo | null>(null);

  const handleViewClick = (tipoEquipo: TipoEquipo) => {
    setSelectedTipoEquipo(tipoEquipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (tipoEquipo: TipoEquipo) => {
    setSelectedTipoEquipo(tipoEquipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipoEquipo(null);
  };

  const handleSaveTipoEquipo = () => {
    fetchTiposEquipo(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (tipo: TipoEquipo) => {
    setPendingToggleTipoEquipo(tipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleTipoEquipo) return;

    const tipo = pendingToggleTipoEquipo;
    const estaActivo = tipo.estado;
    const accion = estaActivo ? "deshabilit" : "habilit";

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/${tipo.id}/toggle-estado`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: !estaActivo }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Tipo de equipo ${accion}ado correctamente`);
      fetchTiposEquipo(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} tipo de equipo:`, error);
      toast.error(`Error al ${accion} tipo de equipo`);
    } finally {
      setPendingToggleTipoEquipo(null);
    }
  };

  const columns: ColumnDef<TipoEquipo>[] = [
    { key: "id", header: "ID", render: (t) => t.id },
    { key: "nombre", header: "Nombre", render: (t) => t.nombre },
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

  const rowActions = (tipo: TipoEquipo): ActionDef[] => [
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
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:max-w-lg sm:flex-row sm:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const valor = e.target.value;
                setSearchTerm(valor);
                fetchTiposEquipo(1, 10, valor, showInactive);
              }}
              placeholder="Por nombre..."
              aria-label="Buscar tipo de equipo"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => {
                  const next = !showInactive;
                  setShowInactive(next);
                  fetchTiposEquipo(1, 10, searchTerm, next);
                }}
                className="h-4 w-4"
              />
              Mostrar inactivos
            </label>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">Mostrando {tiposEquipo.length} de {totalItems} tipos</div>
        </div>
      </div>

      <DataTable
        caption="Tabla de tipos de equipo"
        data={tiposEquipo}
        columns={columns}
        loading={loading}
        showControls={false}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchTiposEquipo(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(t) => t.id}
      />

      <div className="mt-4">
        <TipoEquipoDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} tipoEquipo={selectedTipoEquipo} />
        <TipoEquipoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tipoEquipo={selectedTipoEquipo}
          onSave={handleSaveTipoEquipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleTipoEquipo !== null}
          title="Cambiar estado de tipo de equipo"
          description={
            pendingToggleTipoEquipo
              ? `¿Estás seguro de ${pendingToggleTipoEquipo.estado ? "deshabilitar" : "habilitar"} el tipo de equipo \"${pendingToggleTipoEquipo.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleTipoEquipo(null)}
          confirmText={pendingToggleTipoEquipo?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleTipoEquipo?.estado ?? false}
        />
      </div>
    </>
  );
}
