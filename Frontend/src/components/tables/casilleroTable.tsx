'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import CasilleroDetailsModal from "../modals/CasilleroDetailsModal";
import CasilleroEditModal from "../modals/CasilleroEditModal";
import { toast } from "react-toastify";
import { Casillero, useCasillero } from "@/hooks/useCasillero";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import { 
  EyeIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  InboxIcon,
  LockOpenIcon,
  LockClosedIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

interface CasilleroTableProps {
  casilleroHook?: any;
}

export default function CasilleroTable({ casilleroHook }: CasilleroTableProps) {
  const internalHook = useCasillero();
  const hook = casilleroHook || internalHook;

  const {
    casilleros,
    loading,
    setCasilleros,
    fetchCasilleros,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    releaseCasillero,
    toggleCasilleroStatus,
  } = hook;

  const [selectedCasillero, setSelectedCasillero] = useState<Casillero | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleEstadoCasillero, setPendingToggleEstadoCasillero] = useState<Casillero | null>(null);
  const [pendingToggleOcupacionCasillero, setPendingToggleOcupacionCasillero] = useState<Casillero | null>(null);

  const handleViewClick = (casillero: Casillero) => {
    setSelectedCasillero(casillero);
    setIsModalOpen(true);
  };

  const handleEditClick = (casillero: Casillero) => {
    setSelectedCasillero(casillero);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCasillero(null);
  };

  const handleSaveCasillero = (casilleroActualizado: Casillero) => {
    setCasilleros((prev: Casillero[]) => prev.map((c) => (c.id === casilleroActualizado.id ? casilleroActualizado : c)));
    fetchCasilleros(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (casillero: Casillero) => {
    if (casillero.estado && casillero.situacion === "Ocupado") {
      toast.error("No se puede desactivar un casillero ocupado");
      return;
    }
    setPendingToggleEstadoCasillero(casillero);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleEstadoCasillero) return;

    const casillero = pendingToggleEstadoCasillero;
    const estaActivo = casillero.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleCasilleroStatus(casillero.id);
      toast.success(`Casillero ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchCasilleros(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} casillero:`, error);
      toast.error(`Error al ${accion} casillero`);
    } finally {
      setPendingToggleEstadoCasillero(null);
    }
  };

  const handleToggleOcupacion = (casillero: Casillero) => {
    setPendingToggleOcupacionCasillero(casillero);
  };

  const confirmToggleOcupacion = async () => {
    if (!pendingToggleOcupacionCasillero) return;

    const casillero = pendingToggleOcupacionCasillero;
    const estaOcupado = casillero.situacion === "Ocupado";

    try {
      if (estaOcupado) {
        await releaseCasillero(casillero.id);
        toast.success("Casillero liberado correctamente");
      } else {
        toast.info("Asignación de orden desde esta tabla próximamente");
        return;
      }

      fetchCasilleros(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al cambiar ocupación:`, error);
      toast.error(`Error al procesar solicitud`);
    } finally {
      setPendingToggleOcupacionCasillero(null);
    }
  };

  const columns: ColumnDef<Casillero>[] = [
    {
      key: "codigo",
      header: "Código / ID",
      render: (casillero) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <InboxIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {casillero.codigo}
            </p>
            <p className="text-xs text-gray-500">ID: #{casillero.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (casillero) => (
        <div className="max-w-[250px] xl:max-w-[400px]">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
              {casillero.descripcion || "Sin descripción"}
          </p>
        </div>
      ),
    },
    {
      key: "situacion",
      header: "Situación",
      render: (casillero) => (
        <Badge size="sm" variant="light" color={casillero.situacion === "Ocupado" ? "warning" : "success"}>
          <div className="flex items-center gap-1.5">
            {casillero.situacion === "Ocupado" ? <LockClosedIcon className="h-3 w-3" /> : <LockOpenIcon className="h-3 w-3" />}
            {casillero.situacion}
          </div>
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (casillero) => (
        <Badge size="sm" variant="light" color={casillero.estado ? "success" : "error"}>
          {casillero.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (casillero: Casillero): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ver detalles",
      onClick: () => handleViewClick(casillero),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar casillero",
      onClick: () => handleEditClick(casillero),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "release",
      label: <ClipboardDocumentCheckIcon className="h-4 w-4" />,
      text: casillero.situacion === "Ocupado" ? "Liberar casillero" : "Asignar orden",
      onClick: () => handleToggleOcupacion(casillero),
      className: casillero.situacion === "Ocupado"
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: casillero.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: casillero.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(casillero),
      className: casillero.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de casilleros"
        data={showInactive ? casilleros : casilleros.filter((c: Casillero) => c.estado)}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchCasilleros(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchCasilleros(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchCasilleros(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(casillero) => casillero.id}
      />

      <div className="mt-4">
        <CasilleroDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} casillero={selectedCasillero} />
        <CasilleroEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          casillero={selectedCasillero}
          onSave={handleSaveCasillero}
        />
        <ConfirmDialog
          isOpen={pendingToggleEstadoCasillero !== null}
          title="Cambiar estado de casillero"
          description={
            pendingToggleEstadoCasillero
              ? `¿Estás seguro de ${pendingToggleEstadoCasillero.estado ? "deshabilitar" : "habilitar"} el casillero \"${pendingToggleEstadoCasillero.codigo}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleEstadoCasillero(null)}
          confirmText={pendingToggleEstadoCasillero?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleEstadoCasillero?.estado ?? false}
        />
        <ConfirmDialog
          isOpen={pendingToggleOcupacionCasillero !== null}
          title="Cambiar ocupación de casillero"
          description={
            pendingToggleOcupacionCasillero
              ? `¿Estás seguro de ${pendingToggleOcupacionCasillero.situacion === "Ocupado" ? "liberar" : "asignar una orden a"} el casillero \"${pendingToggleOcupacionCasillero.codigo}\"?`
              : ""
          }
          onConfirm={confirmToggleOcupacion}
          onClose={() => setPendingToggleOcupacionCasillero(null)}
          confirmText={pendingToggleOcupacionCasillero?.situacion === "Ocupado" ? "Liberar" : "Asignar"}
          destructive={false}
        />
      </div>
    </>
  );
}
