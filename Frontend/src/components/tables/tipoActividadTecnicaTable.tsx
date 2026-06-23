'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import TipoActividadTecnicaDetailsModal from "../modals/TipoActividadTecnicaDetailsModal";
import TipoActividadTecnicaEditModal from "../modals/TipoActividadTecnicaEditModal";
import { toast } from "react-toastify";
import { TipoActividadTecnica, useTipoActividadTecnica } from "@/hooks/useTipoActividadTecnica";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";

interface TipoActividadTecnicaTableProps {
  tipoActividadHook?: any;
}

export default function TipoActividadTecnicaTable({ tipoActividadHook }: TipoActividadTecnicaTableProps) {
  const internalHook = useTipoActividadTecnica();
  const hook = tipoActividadHook || internalHook;

  const {
    tipos,
    loading,
    setTipos,
    fetchTipos,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleTipoActividadStatus,
  } = hook;

  const [selectedTipo, setSelectedTipo] = useState<TipoActividadTecnica | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleTipoActividad, setPendingToggleTipoActividad] = useState<TipoActividadTecnica | null>(null);

  const handleViewClick = (tipo: TipoActividadTecnica) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (tipo: TipoActividadTecnica) => {
    setSelectedTipo(tipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipo(null);
  };

  const handleSaveTipo = (tipoActualizado: TipoActividadTecnica) => {
    setTipos((prev: TipoActividadTecnica[]) => prev.map((t) => (t.id === tipoActualizado.id ? tipoActualizado : t)));
    fetchTipos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (tipo: TipoActividadTecnica) => {
    setPendingToggleTipoActividad(tipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleTipoActividad) return;

    const tipo = pendingToggleTipoActividad;
    const estaActivo = tipo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleTipoActividadStatus(tipo.id);
      toast.success(`Tipo de actividad técnica ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchTipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} tipo de actividad técnica:`, error);
      toast.error(`Error al ${accion} tipo de actividad técnica`);
    } finally {
      setPendingToggleTipoActividad(null);
    }
  };

  const columns: ColumnDef<TipoActividadTecnica>[] = [
    {
      key: "nombre",
      header: "Tipo / ID",
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {t.nombre}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">ID: #{t.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (t) => (
        <div className="max-w-[300px] xl:max-w-[500px]">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
              {t.descripcion || "Sin descripción"}
          </p>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (t) => (
        <Badge size="sm" variant="light" color={t.estado ? "success" : "error"}>
          {t.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (tipo: TipoActividadTecnica): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(tipo),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar tipo",
      onClick: () => handleEditClick(tipo),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: tipo.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: tipo.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(tipo),
      className: tipo.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de tipos de actividad técnica"
        data={showInactive ? tipos : tipos.filter((t: TipoActividadTecnica) => t.estado)}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchTipos(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchTipos(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchTipos(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(t) => t.id}
      />

      <div className="mt-4">
        <TipoActividadTecnicaDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} tipo={selectedTipo} />
        <TipoActividadTecnicaEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tipo={selectedTipo}
          onSave={handleSaveTipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleTipoActividad !== null}
          title="Cambiar estado de tipo de actividad"
          description={
            pendingToggleTipoActividad
              ? `¿Estás seguro de ${pendingToggleTipoActividad.estado ? "deshabilitar" : "habilitar"} el tipo \"${pendingToggleTipoActividad.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleTipoActividad(null)}
          confirmText={pendingToggleTipoActividad?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleTipoActividad?.estado ?? false}
        />
      </div>
    </>
  );
}
