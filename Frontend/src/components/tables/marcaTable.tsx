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
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  TagIcon
} from "@heroicons/react/24/outline";

interface MarcaTableProps {
  marcasHook?: any; // Using any for simplicity as UseMarcasReturn might not be exported
}

export default function MarcaTable({ marcasHook }: MarcaTableProps) {
  const internalHook = useMarcas();
  const hook = marcasHook || internalHook;
  
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
  } = hook;

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
    setMarcas((prev: Marca[]) => prev.map((m) => (m.id === marcaActualizada.id ? marcaActualizada : m)));
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
      key: "nombre",
      header: "Marca",
      render: (marca) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <TagIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {marca.nombre}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">ID: #{marca.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (marca) => (
        <Badge size="sm" variant="light" color={marca.estado ? "success" : "error"}>
          {marca.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (marca: Marca): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(marca),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar marca",
      onClick: () => handleEditClick(marca),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: marca.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: marca.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(marca),
      className: marca.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de marcas"
        data={showDisabled ? marcas : marcas.filter((m: Marca) => m.estado)}
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