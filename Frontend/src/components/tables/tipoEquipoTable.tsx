'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import TipoEquipoDetailsModal from "../modals/TipoEquipoDetailsModal";
import TipoEquipoEditModal from "../modals/TipoEquipoEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { TipoEquipo, useTipoEquipo } from "@/hooks/useTipoEquipo";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";

interface TipoEquipoTableProps {
  tiposEquipoHook?: any;
}

export default function TipoEquipoTable({ tiposEquipoHook }: TipoEquipoTableProps) {
  const internalHook = useTipoEquipo();
  const hook = tiposEquipoHook || internalHook;

  const {
    tiposEquipo,
    loading,
    fetchTiposEquipo,
    setTiposEquipo,
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

  const [selectedTipoEquipo, setSelectedTipoEquipo] = useState<TipoEquipo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleTipoEquipo, setPendingToggleTipoEquipo] = useState<TipoEquipo | null>(null);

  const handleViewClick = (tipoEquipo: TipoEquipo) => {
    setSelectedTipoEquipo(tipoEquipo);
    setIsModalOpen(true);
  };

  const handleEditClick = (tipoEquipo: TipoEquipo) => {
    setSelectedTipoEquipo(tipoEquipo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTipoEquipo(null);
  };

  const handleSaveTipoEquipo = (tipoActualizado: TipoEquipo) => {
    setTiposEquipo((prev: TipoEquipo[]) => prev.map((t) => (t.id === tipoActualizado.id ? tipoActualizado : t)));
    fetchTiposEquipo(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (tipo: TipoEquipo) => {
    setPendingToggleTipoEquipo(tipo);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleTipoEquipo) return;

    const tipo = pendingToggleTipoEquipo;
    const estaActivo = tipo.estado;
    const accion = estaActivo ? "deshabilit" : "habilit";

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/${tipo.id}/toggle-estado`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: !estaActivo }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Tipo de equipo ${accion}ado correctamente`);
      fetchTiposEquipo(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} tipo de equipo:`, error);
      toast.error(`Error al ${accion} tipo de equipo`);
    } finally {
      setPendingToggleTipoEquipo(null);
    }
  };

  const columns: ColumnDef<TipoEquipo>[] = [
    {
      key: "nombre",
      header: "Tipo de Equipo",
      render: (tipo) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {tipo.nombre}
            </p>
            <p className="text-xs text-gray-500">ID: #{tipo.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (tipo) => (
        <Badge size="sm" variant="light" color={tipo.estado ? "success" : "error"}>
          {tipo.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (tipo: TipoEquipo): ActionDef[] => [
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
        caption="Tabla de tipos de equipo"
        data={showInactive ? tiposEquipo : tiposEquipo.filter((t: TipoEquipo) => t.estado)}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchTiposEquipo(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchTiposEquipo(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchTiposEquipo(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(t) => t.id}
      />

      <div className="mt-4">
        <TipoEquipoDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} tipoEquipo={selectedTipoEquipo} />
        <TipoEquipoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          tipoEquipo={selectedTipoEquipo}
          onSave={handleSaveTipoEquipo}
        />
        <ConfirmDialog
          isOpen={pendingToggleTipoEquipo !== null}
          title="Cambiar estado de tipo de equipo"
          description={
            pendingToggleTipoEquipo
              ? `¿Estás seguro de ${pendingToggleTipoEquipo.estado ? "deshabilitar" : "habilitar"} el tipo de equipo \"${pendingToggleTipoEquipo.nombre}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleTipoEquipo(null)}
          confirmText={pendingToggleTipoEquipo?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleTipoEquipo?.estado ?? false}
        />
      </div>
    </>
  );
}
