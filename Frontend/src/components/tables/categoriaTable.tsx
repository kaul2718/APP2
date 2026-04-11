'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import CategoriaDetailsModal from "../modals/CategoriaDetailsModal";
import CategoriaEditModal from "../modals/CategoriaEditModal";
import { toast } from "react-toastify";
import { Categoria, useCategoria } from "@/hooks/useCategoria";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function CategoriaTable() {
  const {
    categorias,
    loading,
    setCategorias,
    fetchCategorias,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleCategoriaStatus,
  } = useCategoria();

  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleCategoria, setPendingToggleCategoria] = useState<Categoria | null>(null);

  const handleViewClick = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setIsModalOpen(true);
  };

  const handleEditClick = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategoria(null);
  };

  const handleSaveCategoria = (categoriaActualizada: Categoria) => {
    setCategorias((prev) => prev.map((c) => (c.id === categoriaActualizada.id ? categoriaActualizada : c)));
    fetchCategorias(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (categoria: Categoria) => {
    setPendingToggleCategoria(categoria);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleCategoria) return;

    const categoria = pendingToggleCategoria;
    const estaActivo = categoria.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleCategoriaStatus(categoria.id);
      toast.success(`Categoria ${estaActivo ? "deshabilitada" : "habilitada"} correctamente`);
      fetchCategorias(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} categoria:`, error);
      toast.error(`Error al ${accion} categoria`);
    } finally {
      setPendingToggleCategoria(null);
    }
  };

  const columns: ColumnDef<Categoria>[] = [
    { key: "id", header: "ID", render: (c) => c.id },
    { key: "nombre", header: "Nombre", render: (c) => c.nombre },
    { key: "descripcion", header: "Descripcion", render: (c) => c.descripcion || "Sin descripcion" },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <Badge size="sm" color={c.estado ? "success" : "error"}>
          {c.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (categoria: Categoria): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(categoria),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(categoria),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: categoria.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(categoria),
      className: categoria.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de categorias"
        data={categorias}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchCategorias(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchCategorias(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchCategorias(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(c) => c.id}
      />

      <div className="mt-4">
        <CategoriaDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} categoria={selectedCategoria} />
        <CategoriaEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          categoria={selectedCategoria}
          onSave={handleSaveCategoria}
        />
        <ConfirmDialog
          isOpen={pendingToggleCategoria !== null}
          title="Cambiar estado de categoria"
          description={
            pendingToggleCategoria
              ? `¿Estás seguro de ${pendingToggleCategoria.estado ? "deshabilitar" : "habilitar"} la categoria \"${pendingToggleCategoria.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleCategoria(null)}
          confirmText={pendingToggleCategoria?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleCategoria?.estado ?? false}
        />
      </div>
    </>
  );
}
