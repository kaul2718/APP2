'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import MarcaDetailsModal from "../modals/MarcaDetailsModal";
import MarcaEditModal from "../modals/MarcaEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Marca, useMarcas } from "@/hooks/useMarcas";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function MarcaTable() {
  const {
    marcas,
    loading,
    setMarcas,
    fetchMarcas,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showDisabled,
    setShowDisabled,
  } = useMarcas();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedMarca, setSelectedMarca] = useState<Marca | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleMarca, setPendingToggleMarca] = useState<Marca | null>(null);

  const handleViewClick = (marca: Marca) => {
    setSelectedMarca(marca);
    setIsModalOpen(true);
  };

  const handleEditClick = (marca: Marca) => {
    setSelectedMarca(marca);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMarca(null);
  };

  const handleSaveMarca = (marcaActualizada: Marca) => {
    setMarcas((prev) => prev.map((m) => (m.id === marcaActualizada.id ? marcaActualizada : m)));
    fetchMarcas(currentPage, 10, searchTerm, showDisabled);
  };

  const handleToggleEstado = (marca: Marca) => {
    setPendingToggleMarca(marca);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleMarca) return;

    const marca = pendingToggleMarca;
    const estaActivo = marca.estado;
    const accion = estaActivo ? "deshabilit" : "habilit";

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/marcas/${marca.id}/toggle-estado`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: !estaActivo }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Marca ${accion}ada correctamente`);
      fetchMarcas(currentPage, 10, searchTerm, showDisabled);
    } catch (error) {
      console.error(`Error al ${accion} marca:`, error);
      toast.error(`Error al ${accion} marca`);
    } finally {
      setPendingToggleMarca(null);
    }
  };

  const columns: ColumnDef<Marca>[] = [
    {
      key: "id",
      header: "ID",
      render: (marca) => marca.id,
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (marca) => marca.nombre,
    },
    {
      key: "estado",
      header: "Estado",
      render: (marca) => (
        <Badge size="sm" color={marca.estado ? "success" : "error"}>
          {marca.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (marca: Marca): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(marca),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(marca),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: marca.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(marca),
      className: marca.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de marcas"
        data={marcas}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchMarcas(1, 10, term, showDisabled);
        }}
        showInactive={showDisabled}
        onToggleInactive={() => {
          const nextValue = !showDisabled;
          setShowDisabled(nextValue);
          fetchMarcas(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchMarcas(page, 10, searchTerm, showDisabled)}
        actions={rowActions}
        getRowKey={(marca) => marca.id}
      />

      <div className="mt-4">
        <MarcaDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          marca={selectedMarca}
        />
        <MarcaEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          marca={selectedMarca}
          onSave={handleSaveMarca}
        />
        <ConfirmDialog
          isOpen={pendingToggleMarca !== null}
          title="Cambiar estado de marca"
          description={
            pendingToggleMarca
              ? `¿Estás seguro de ${pendingToggleMarca.estado ? "deshabilitar" : "habilitar"} la marca \"${pendingToggleMarca.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleMarca(null)}
          confirmText={pendingToggleMarca?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleMarca?.estado ?? false}
        />
      </div>
    </>
  );
}