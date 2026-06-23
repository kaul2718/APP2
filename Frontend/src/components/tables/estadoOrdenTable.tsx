'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import EstadoOrdenDetailsModal from "../modals/EstadoOrdenDetailsModal";
import EstadoOrdenEditModal from "../modals/EstadoOrdenEditModal";
import { toast } from "react-toastify";
import { EstadoOrden, useEstadoOrden } from "@/hooks/useEstadoOrden";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  QueueListIcon
} from "@heroicons/react/24/outline";

interface EstadoOrdenTableProps {
  estadoOrdenHook?: any;
}

export default function EstadoOrdenTable({ estadoOrdenHook }: EstadoOrdenTableProps) {
  const internalHook = useEstadoOrden();
  const hook = estadoOrdenHook || internalHook;

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
  } = hook;

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
    setEstadosOrden((prev: EstadoOrden[]) => prev.map((e) => (e.id === estadoOrdenActualizado.id ? estadoOrdenActualizado : e)));
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
      toast.success(`Estado de orden ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchEstadosOrden(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} estado de orden:`, error);
      toast.error(`Error al ${accion} estado de orden`);
    } finally {
      setPendingToggleEstadoOrden(null);
    }
  };

  const columns: ColumnDef<EstadoOrden>[] = [
    {
      key: "nombre",
      header: "Estado / ID",
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <QueueListIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {e.nombre}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">ID: #{e.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (e) => (
        <div className="max-w-[300px] xl:max-w-[500px]">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
              {e.descripcion || "Sin descripción"}
          </p>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (e) => (
        <Badge size="sm" variant="light" color={e.estado ? "success" : "error"}>
          {e.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (estadoOrden: EstadoOrden): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(estadoOrden),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar estado",
      onClick: () => handleEditClick(estadoOrden),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: estadoOrden.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: estadoOrden.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(estadoOrden),
      className: estadoOrden.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de estados de orden"
        data={showInactive ? estadosOrden : estadosOrden.filter((e: EstadoOrden) => e.estado)}
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
