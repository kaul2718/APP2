'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import DetallePresupuestoItemDetailsModal from "../modals/DetallePresupuestoItemDetailsModal";
import DetallePresupuestoItemEditModal from "../modals/DetallePresupuestoItemEditModal";
import { toast } from "react-toastify";
import { useDetallePresupuestoItem, DetallePresupuestoItem } from "@/hooks/useDetallePresupuestoItem";
import { DataTable, ColumnDef } from "./DataTable";

export default function DetallePresupuestoItemTable({ presupuestoId }: { presupuestoId?: number }) {
  const {
    detalles,
    loading,
    setDetalles,
    fetchDetalles,
    fetchDetallesByPresupuesto,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleDetalleStatus,
    deleteDetalle,
    restoreDetalle,
  } = useDetallePresupuestoItem();

  const [selectedDetalle, setSelectedDetalle] = useState<DetallePresupuestoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingToggleDetalle, setPendingToggleDetalle] = useState<DetallePresupuestoItem | null>(null);

  const refreshData = () => {
    if (presupuestoId) {
      fetchDetallesByPresupuesto(presupuestoId, showInactive)
        .then((rows) => setDetalles(rows))
        .catch(() => undefined);
    } else {
      fetchDetalles(currentPage, 10, searchTerm, showInactive);
    }
  };

  const handleViewClick = (detalle: DetallePresupuestoItem) => {
    setSelectedDetalle(detalle);
    setIsModalOpen(true);
  };

  const handleEditClick = (detalle: DetallePresupuestoItem) => {
    setSelectedDetalle(detalle);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (detalle: DetallePresupuestoItem) => {
    setSelectedDetalle(detalle);
    setIsDeleteModalOpen(true);
  };

  const handleRestoreClick = async (detalle: DetallePresupuestoItem) => {
    try {
      await restoreDetalle(detalle.id);
      toast.success("Detalle de ítem restaurado correctamente");
      refreshData();
    } catch (error) {
      toast.error("Error al restaurar detalle de ítem");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDetalle(null);
  };

  const handleSaveDetalle = (detalleActualizado: DetallePresupuestoItem) => {
    setDetalles((prev) => prev.map((d) => (d.id === detalleActualizado.id ? detalleActualizado : d)));
    refreshData();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDetalle) return;

    try {
      await deleteDetalle(selectedDetalle.id);
      toast.success("Detalle de ítem eliminado correctamente");
      refreshData();
    } catch (error) {
      toast.error("Error al eliminar detalle de ítem");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedDetalle(null);
    }
  };

  const handleToggleEstado = (detalle: DetallePresupuestoItem) => {
    setPendingToggleDetalle(detalle);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleDetalle) return;

    const detalle = pendingToggleDetalle;
    const estaActivo = detalle.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleDetalleStatus(detalle.id);
      toast.success(`Detalle de ítem ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      refreshData();
    } catch (error) {
      toast.error(`Error al ${accion} detalle de ítem`);
    } finally {
      setPendingToggleDetalle(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);

  const columns: ColumnDef<DetallePresupuestoItem>[] = [
    { key: "id", header: "ID", render: (d) => d.id },
    ...(!presupuestoId
      ? [
          {
            key: "presupuestoId",
            header: "Presupuesto",
            render: (d: DetallePresupuestoItem) => d.presupuestoId ?? "-",
          },
        ]
      : []),
    {
      key: "repuesto",
      header: "Ítem / Parte",
      render: (d) => (
        <div>
          <span className="block font-medium text-gray-800 dark:text-white/90">{d.parte?.nombre || "Ítem no disponible"}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{d.parte?.codigoInterno ? `Código: ${d.parte.codigoInterno}` : "Sin código"}</span>
        </div>
      ),
    },
    { key: "cantidad", header: "Cantidad", render: (d) => d.cantidad },
    { key: "precioUnitario", header: "Precio Unitario", render: (d) => formatCurrency(d.precioUnitario) },
    { key: "subtotal", header: "Subtotal", render: (d) => <span className="font-medium">{formatCurrency(d.subtotal)}</span> },
    {
      key: "estado",
      header: "Estado",
      render: (d) => {
        const estaActivo = d.estado && !d.deletedAt;
        return (
          <Badge size="sm" color={estaActivo ? "success" : "error"}>
            {estaActivo ? "Activo" : d.deletedAt ? "Eliminado" : "Inactivo"}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              const valor = e.target.value;
              setSearchTerm(valor);
              if (presupuestoId) {
                fetchDetallesByPresupuesto(presupuestoId, showInactive)
                  .then((rows) => setDetalles(rows))
                  .catch(() => undefined);
              } else {
                fetchDetalles(1, 10, valor, showInactive);
              }
            }}
            placeholder="Por nombre del ítem..."
            aria-label="Buscar detalles de ítems"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-sm"
          />

          {!presupuestoId && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => {
                  const newValue = !showInactive;
                  setShowInactive(newValue);
                  fetchDetalles(1, 10, searchTerm, newValue);
                }}
                className="h-4 w-4"
              />
              Mostrar inactivos
            </label>
          )}
        </div>
      </div>

      <DataTable
        caption="Tabla de detalles de ítems del presupuesto"
        data={detalles}
        columns={columns}
        loading={loading}
        showControls={false}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchDetalles(page, 10, searchTerm, showInactive)}
        getRowKey={(d) => d.id}
        renderActions={(detalle) => {
          const estaActivo = detalle.estado && !detalle.deletedAt;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => handleViewClick(detalle)} className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">Ver</button>
              <button
                type="button"
                onClick={() => handleEditClick(detalle)}
                disabled={!estaActivo}
                className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-40"
              >
                Editar
              </button>
              {estaActivo ? (
                <button type="button" onClick={() => handleDeleteClick(detalle)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Eliminar</button>
              ) : (
                <button type="button" onClick={() => void handleRestoreClick(detalle)} className="rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50">Restaurar</button>
              )}
              <button
                type="button"
                onClick={() => handleToggleEstado(detalle)}
                className={estaActivo ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50" : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50"}
              >
                {estaActivo ? "Deshabilitar" : "Habilitar"}
              </button>
            </div>
          );
        }}
      />

      <div className="mt-4">
        <DetallePresupuestoItemDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} detalle={selectedDetalle} />
        <DetallePresupuestoItemEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          detalle={selectedDetalle}
          onSave={handleSaveDetalle}
        />
        <ConfirmDialog
          isOpen={pendingToggleDetalle !== null}
          title="Cambiar estado de detalle de ítem"
          description={
            pendingToggleDetalle
              ? `¿Estás seguro de ${pendingToggleDetalle.estado ? "deshabilitar" : "habilitar"} este detalle de ítem?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleDetalle(null)}
          confirmText={pendingToggleDetalle?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleDetalle?.estado ?? false}
        />
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Confirmar eliminación"
        description="¿Estás seguro de que deseas eliminar este detalle de ítem?"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDetalle(null);
        }}
        confirmText="Eliminar"
        destructive
      />
    </>
  );
}
