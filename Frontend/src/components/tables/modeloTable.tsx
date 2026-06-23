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
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  Square3Stack3DIcon,
  TagIcon
} from "@heroicons/react/24/outline";

interface ModeloTableProps {
  modeloHook?: any;
}

export default function ModeloTable({ modeloHook }: ModeloTableProps) {
  const internalHook = useModelo();
  const hook = modeloHook || internalHook;

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
  } = hook;

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
    setModelos((prev: Modelo[]) => prev.map((m) => (m.id === modeloActualizado.id ? modeloActualizado : m)));
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
      key: "nombre",
      header: "Modelo",
      render: (modelo) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <Square3Stack3DIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {modelo.nombre}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">ID: #{modelo.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "marca",
      header: "Marca",
      render: (modelo) => (
        <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {modelo.marca?.nombre || "Sin marca"}
            </span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (modelo) => (
        <Badge size="sm" variant="light" color={modelo.estado ? "success" : "error"}>
          {modelo.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (modelo: Modelo): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(modelo),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar modelo",
      onClick: () => handleEditClick(modelo),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: modelo.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: modelo.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(modelo),
      className: modelo.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de modelos"
        data={showInactive ? modelos : modelos.filter((m: Modelo) => m.estado)}
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
