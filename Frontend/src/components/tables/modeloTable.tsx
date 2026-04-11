'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import ModeloDetailsModal from "../modals/ModeloDetailsModal";
import ModeloEditModal from "../modals/ModeloEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Modelo, useModelo } from "@/hooks/useModelo";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function ModeloTable() {
  const {
    modelos,
    loading,
    setModelos,
    fetchModelos,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
  } = useModelo();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleModelo, setPendingToggleModelo] = useState<Modelo | null>(null);

  const handleViewClick = (modelo: Modelo) => {
    setSelectedModelo(modelo);
    setIsModalOpen(true);
  };

  const handleEditClick = (modelo: Modelo) => {
    setSelectedModelo(modelo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModelo(null);
  };

  const handleSaveModelo = (modeloActualizado: Modelo) => {
    setModelos((prev) => prev.map((m) => (m.id === modeloActualizado.id ? modeloActualizado : m)));
    fetchModelos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (modelo: Modelo) => {
    setPendingToggleModelo(modelo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleModelo) return;

    const modelo = pendingToggleModelo;
    const estaActivo = modelo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${modelo.id}/toggle-estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Modelo ${estaActivo ? 'deshabilitado' : 'habilitado'} correctamente`);
      fetchModelos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} modelo:`, error);
      toast.error(`Error al ${accion} modelo`);
    } finally {
      setPendingToggleModelo(null);
    }
  };

  const columns: ColumnDef<Modelo>[] = [
    {
      key: "id",
      header: "ID",
      render: (modelo) => modelo.id,
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (modelo) => modelo.nombre,
    },
    {
      key: "marca",
      header: "Marca",
      render: (modelo) => modelo.marca?.nombre || "Sin marca",
    },
    {
      key: "estado",
      header: "Estado",
      render: (modelo) => (
        <Badge size="sm" color={modelo.estado ? "success" : "error"}>
          {modelo.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (modelo: Modelo): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(modelo),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(modelo),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: modelo.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(modelo),
      className: modelo.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de modelos"
        data={modelos}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchModelos(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchModelos(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchModelos(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(modelo) => modelo.id}
      />

      <div className="mt-4">
        <ModeloDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          modelo={selectedModelo}
        />
        <ModeloEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          modelo={selectedModelo}
          onSave={handleSaveModelo}
        />
        <ConfirmDialog
          isOpen={pendingToggleModelo !== null}
          title="Cambiar estado de modelo"
          description={
            pendingToggleModelo
              ? `¿Estás seguro de ${pendingToggleModelo.estado ? "deshabilitar" : "habilitar"} el modelo \"${pendingToggleModelo.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleModelo(null)}
          confirmText={pendingToggleModelo?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleModelo?.estado ?? false}
        />
      </div>
    </>
  );
}
