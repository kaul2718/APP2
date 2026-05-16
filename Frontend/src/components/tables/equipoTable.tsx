'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import EquipoDetailsModal from "../modals/EquipoDetailsModal";
import EquipoEditModal from "../modals/EquipoEditModal";
import { toast } from "react-toastify";
import { Equipo, useEquipos } from "@/hooks/useEquipos";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  ComputerDesktopIcon,
  TagIcon,
  Square3Stack3DIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

interface EquipoTableProps {
  equipoHook?: any;
}

export default function EquipoTable({ equipoHook }: EquipoTableProps) {
  const internalHook = useEquipos();
  const hook = equipoHook || internalHook;

  const {
    equipos,
    loading,
    setEquipos,
    fetchEquipos,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleEstado,
  } = hook;

  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleEquipo, setPendingToggleEquipo] = useState<Equipo | null>(null);

  const handleViewClick = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  const handleSaveEquipo = (equipoActualizado: Equipo) => {
    setEquipos((prev: Equipo[]) => prev.map((e) => (e.id === equipoActualizado.id ? equipoActualizado : e)));
    fetchEquipos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (equipo: Equipo) => {
    setPendingToggleEquipo(equipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleEquipo) return;

    const equipo = pendingToggleEquipo;
    const estaActivo = equipo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleEstado(equipo);
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} equipo:`, error);
      toast.error(error instanceof Error ? error.message : `Error al ${accion} equipo`);
    } finally {
      setPendingToggleEquipo(null);
    }
  };

  const columns: ColumnDef<Equipo>[] = [
    {
      key: "numeroSerie",
      header: "Equipo / S/N",
      render: (equipo) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {equipo.numeroSerie}
            </p>
            <p className="text-xs text-gray-500">ID: #{equipo.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "detalles",
      header: "Detalles",
      render: (equipo) => (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <CpuChipIcon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {equipo.tipoEquipo?.nombre || "Sin tipo"}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <TagIcon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {equipo.marca?.nombre || "Sin marca"}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Square3Stack3DIcon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {equipo.modelo?.nombre || "Sin modelo"}
                </span>
            </div>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (equipo) => (
        <Badge size="sm" variant="light" color={equipo.estado ? "success" : "error"}>
          {equipo.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (equipo: Equipo): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(equipo),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar equipo",
      onClick: () => handleEditClick(equipo),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: equipo.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: equipo.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(equipo),
      className: equipo.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de equipos"
        data={showInactive ? equipos : equipos.filter((e: Equipo) => e.estado)}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchEquipos(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchEquipos(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchEquipos(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(equipo) => equipo.id}
      />

      <div className="mt-4">
        <EquipoDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          equipo={selectedEquipo}
        />
        <EquipoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          equipo={selectedEquipo}
          onSave={handleSaveEquipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleEquipo !== null}
          title="Cambiar estado de equipo"
          description={
            pendingToggleEquipo
              ? `¿Estás seguro de ${pendingToggleEquipo.estado ? "deshabilitar" : "habilitar"} el equipo \"${pendingToggleEquipo.numeroSerie}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleEquipo(null)}
          confirmText={pendingToggleEquipo?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleEquipo?.estado ?? false}
        />
      </div>
    </>
  );
}
