'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import CategoriaDetailsModal from "../modals/CategoriaDetailsModal";
import CategoriaEditModal from "../modals/CategoriaEditModal";
import { toast } from "react-toastify";
import { Categoria, useCategoria } from "@/hooks/useCategoria";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  TagIcon
} from "@heroicons/react/24/outline";

interface CategoriaTableProps {
  categoriaHook?: any;
}

export default function CategoriaTable({ categoriaHook }: CategoriaTableProps) {
  const internalHook = useCategoria();
  const hook = categoriaHook || internalHook;
  const { hasPermission } = usePermissions();

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
  } = hook;

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
    setCategorias((prev: Categoria[]) => prev.map((c) => (c.id === categoriaActualizada.id ? categoriaActualizada : c)));
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
      toast.success(`Categoría ${estaActivo ? "deshabilitada" : "habilitada"} correctamente`);
      fetchCategorias(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} categoría:`, error);
      toast.error(`Error al ${accion} categoría`);
    } finally {
      setPendingToggleCategoria(null);
    }
  };

  const columns: ColumnDef<Categoria>[] = [
    {
      key: "nombre",
      header: "Categoría / ID",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <TagIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {c.nombre}
            </p>
            <p className="text-xs text-gray-500 font-mono">ID: #{c.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (c) => (
        <div className="max-w-[300px] xl:max-w-[500px]">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
              {c.descripcion || "Sin descripción proporcionada"}
          </p>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <Badge size="sm" variant="light" color={c.estado ? "success" : "error"}>
          {c.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (categoria: Categoria): ActionDef[] => {
    const actions: ActionDef[] = [
      {
        key: "view",
        label: <EyeIcon className="h-4 w-4" />,
        text: "Ver detalles",
        onClick: () => handleViewClick(categoria),
        className:
          "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
      },
    ];

    if (hasPermission("almacen.manage")) {
      actions.push(
        {
          key: "edit",
          label: <PencilSquareIcon className="h-4 w-4" />,
          text: "Editar categoría",
          onClick: () => handleEditClick(categoria),
          className:
            "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
        },
        {
          key: "toggle",
          label: categoria.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
          text: categoria.estado ? "Deshabilitar" : "Habilitar",
          onClick: () => handleToggleEstado(categoria),
          className: categoria.estado
            ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
        }
      );
    }

    return actions;
  };

  return (
    <>
      <DataTable
        caption="Tabla de categorías registradas"
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
          title="Cambiar estado de categoría"
          description={
            pendingToggleCategoria
              ? `¿Estás seguro de ${pendingToggleCategoria.estado ? "deshabilitar" : "habilitar"} la categoría \"${pendingToggleCategoria.nombre}\"?`
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
