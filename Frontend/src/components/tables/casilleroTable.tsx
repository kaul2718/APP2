'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import CasilleroDetailsModal from "../modals/CasilleroDetailsModal";
import CasilleroEditModal from "../modals/CasilleroEditModal";
import { toast } from "react-toastify";
import { Casillero, useCasillero } from "@/hooks/useCasillero";
import { DataTable, ColumnDef } from "./DataTable";

export default function CasilleroTable() {
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
    situacionFilter,
    setSituacionFilter,
    releaseCasillero,
    toggleCasilleroStatus,
  } = useCasillero();

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
    setCasilleros((prev) => prev.map((c) => (c.id === casilleroActualizado.id ? casilleroActualizado : c)));
    fetchCasilleros(currentPage, 10, searchTerm, showInactive, situacionFilter);
  };

  const handleToggleEstado = (casillero: Casillero) => {
    const estaActivo = casillero.estado;

    if (estaActivo && casillero.situacion === "Ocupado") {
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
      fetchCasilleros(currentPage, 10, searchTerm, showInactive, situacionFilter);
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
    const accion = estaOcupado ? "liberar" : "asignar orden";

    try {
      if (estaOcupado) {
        await releaseCasillero(casillero.id);
        toast.success("Casillero liberado correctamente");
      } else {
        toast.info("Implementar logica para asignar orden");
        return;
      }

      fetchCasilleros(currentPage, 10, searchTerm, showInactive, situacionFilter);
    } catch (error) {
      console.error(`Error al ${accion} casillero:`, error);
      toast.error(`Error al ${accion} casillero`);
    } finally {
      setPendingToggleOcupacionCasillero(null);
    }
  };

  const columns: ColumnDef<Casillero>[] = [
    {
      key: "id",
      header: "ID",
      render: (casillero) => casillero.id,
    },
    {
      key: "codigo",
      header: "Codigo",
      render: (casillero) => casillero.codigo,
    },
    {
      key: "descripcion",
      header: "Descripcion",
      render: (casillero) => casillero.descripcion,
    },
    {
      key: "situacion",
      header: "Situacion",
      render: (casillero) => (
        <Badge size="sm" color={casillero.situacion === "Ocupado" ? "error" : "success"}>
          {casillero.situacion}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (casillero) => (
        <Badge size="sm" color={casillero.estado ? "success" : "error"}>
          {casillero.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const valor = e.target.value;
                setSearchTerm(valor);
                fetchCasilleros(1, 10, valor, showInactive, situacionFilter);
              }}
              placeholder="Por codigo o descripcion..."
              aria-label="Buscar casilleros"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-sm"
            />

            <select
              value={situacionFilter || ""}
              onChange={(e) => {
                const value = e.target.value || undefined;
                const situacion = value as "Disponible" | "Ocupado" | undefined;
                setSituacionFilter(situacion);
                fetchCasilleros(1, 10, searchTerm, showInactive, situacion);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Ocupado">Ocupado</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={() => {
                const nextValue = !showInactive;
                setShowInactive(nextValue);
                fetchCasilleros(1, 10, searchTerm, nextValue, situacionFilter);
              }}
              className="h-4 w-4"
            />
            Mostrar inactivos
          </label>
        </div>
      </div>

      <DataTable
        caption="Tabla de casilleros"
        data={casilleros}
        columns={columns}
        loading={loading}
        showControls={false}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchCasilleros(page, 10, searchTerm, showInactive, situacionFilter)}
        getRowKey={(casillero) => casillero.id}
        renderActions={(casillero) => {
          const estaActivo = casillero.estado;
          const estaOcupado = casillero.situacion === "Ocupado";

          return (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => handleViewClick(casillero)} className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">Ver</button>
              <button type="button" onClick={() => handleEditClick(casillero)} className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50">Editar</button>
              <button
                type="button"
                onClick={() => handleToggleOcupacion(casillero)}
                className={estaOcupado ? "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50" : "rounded border border-purple-300 px-2 py-1 text-xs text-purple-700 hover:bg-purple-50"}
              >
                {estaOcupado ? "Liberar" : "Asignar orden"}
              </button>
              <button
                type="button"
                onClick={() => handleToggleEstado(casillero)}
                className={estaActivo ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50" : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50"}
              >
                {estaActivo ? "Deshabilitar" : "Habilitar"}
              </button>
            </div>
          );
        }}
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
          title="Cambiar ocupacion de casillero"
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
