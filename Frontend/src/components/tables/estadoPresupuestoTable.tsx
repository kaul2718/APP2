'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import EstadoPresupuestoDetailsModal from "../modals/EstadoPresupuestoDetailsModal";
import EstadoPresupuestoEditModal from "../modals/EstadoPresupuestoEditModal";
import { toast } from "react-toastify";
import { EstadoPresupuesto, useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

interface EstadoPresupuestoTableProps {
  estadoPresupuestoHook?: any;
}

export default function EstadoPresupuestoTable({ estadoPresupuestoHook }: EstadoPresupuestoTableProps) {
  const internalHook = useEstadoPresupuesto();
  const hook = estadoPresupuestoHook || internalHook;

  const {
    estados,
    loading,
    setEstados,
    fetchEstados,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleEstadoPresupuestoStatus,
  } = hook;

  const [selectedEstado, setSelectedEstado] = useState<EstadoPresupuesto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleEstado, setPendingToggleEstado] = useState<EstadoPresupuesto | null>(null);

  const handleViewClick = (estado: EstadoPresupuesto) => {
    setSelectedEstado(estado);
    setIsModalOpen(true);
  };

  const handleEditClick = (estado: EstadoPresupuesto) => {
    setSelectedEstado(estado);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEstado(null);
  };

  const handleSaveEstado = (estadoActualizado: EstadoPresupuesto) => {
    setEstados((prev: EstadoPresupuesto[]) => prev.map((e) => (e.id === estadoActualizado.id ? estadoActualizado : e)));
    fetchEstados(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (estado: EstadoPresupuesto) => {
    setPendingToggleEstado(estado);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleEstado) return;

    const estado = pendingToggleEstado;
    const estaActivo = estado.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleEstadoPresupuestoStatus(estado.id);
      toast.success(`Estado de presupuesto ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchEstados(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} estado de presupuesto:`, error);
      toast.error(`Error al ${accion} estado de presupuesto`);
    } finally {
      setPendingToggleEstado(null);
    }
  };

  const columns: ColumnDef<EstadoPresupuesto>[] = [
    {
      key: "nombre",
      header: "Estado / ID",
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <BanknotesIcon className="h-5 w-5 text-gray-500" />
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

  const rowActions = (estado: EstadoPresupuesto): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(estado),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar estado",
      onClick: () => handleEditClick(estado),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: estado.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: estado.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(estado),
      className: estado.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de estados de presupuesto"
        data={estados}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchEstados(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchEstados(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchEstados(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(e) => e.id}
      />

      <div className="mt-4">
        <EstadoPresupuestoDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} estado={selectedEstado} />
        <EstadoPresupuestoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          estado={selectedEstado}
          onSave={handleSaveEstado}
        />
        <ConfirmDialog
          isOpen={pendingToggleEstado !== null}
          title="Cambiar estado de presupuesto"
          description={
            pendingToggleEstado
              ? `¿Estás seguro de ${pendingToggleEstado.estado ? "deshabilitar" : "habilitar"} el estado \"${pendingToggleEstado.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleEstado(null)}
          confirmText={pendingToggleEstado?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleEstado?.estado ?? false}
        />
      </div>
    </>
  );
}
