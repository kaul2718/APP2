'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import InventarioDetailsModal from "../modals/InventarioDetailsModal";
import InventarioEditModal from "../modals/InventarioEditModal";
import { toast } from "react-toastify";
import { Inventario, useInventario } from "@/hooks/useInventario";
import {
  CubeIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  ExclamationCircleIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { TrashBinIcon } from "@/icons";
import { DataTable, ColumnDef } from "./DataTable";

export default function InventarioTable() {
  const {
    inventarios,
    loading,
    setInventarios,
    fetchInventarios,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleInventarioStatus,
    updateStock,
  } = useInventario();

  const [selectedInventario, setSelectedInventario] = useState<Inventario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleInventario, setPendingToggleInventario] = useState<Inventario | null>(null);
  const [stockOperation, setStockOperation] = useState<{
    id: number | null;
    type: "add" | "subtract";
    amount: number;
  }>({
    id: null,
    type: "add",
    amount: 1,
  });

  const handleViewClick = (inventario: Inventario) => {
    setSelectedInventario(inventario);
    setIsModalOpen(true);
  };

  const handleEditClick = (inventario: Inventario) => {
    setSelectedInventario(inventario);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInventario(null);
  };

  const handleSaveInventario = (inventarioActualizado: Inventario) => {
    setInventarios((prev) => prev.map((i) => (i.id === inventarioActualizado.id ? inventarioActualizado : i)));
    fetchInventarios(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = (inventario: Inventario) => {
    setPendingToggleInventario(inventario);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleInventario) return;

    const inventario = pendingToggleInventario;
    const estaActivo = inventario.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleInventarioStatus(inventario.id);
      fetchInventarios(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} inventario:`, error);
      toast.error(`Error al ${accion} inventario`);
    } finally {
      setPendingToggleInventario(null);
    }
  };

  const handleStockOperation = async () => {
    if (!stockOperation.id || stockOperation.amount <= 0) return;

    try {
      await updateStock(stockOperation.id, stockOperation.amount, stockOperation.type);
      setStockOperation({ id: null, type: "add", amount: 1 });
      fetchInventarios(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar stock");
    }
  };

  const openStockOperation = (id: number, type: "add" | "subtract") => {
    setStockOperation({ id, type, amount: 1 });
  };

  const closeStockOperation = () => {
    setStockOperation({ id: null, type: "add", amount: 1 });
  };

  const columns: ColumnDef<Inventario>[] = [
    {
      key: "id",
      header: "ID",
      render: (inventario) => inventario.id,
    },
    {
      key: "parte",
      header: "Parte",
      render: (inventario) => (
        <div className="flex items-center gap-3">
          <CubeIcon className="h-5 w-5 text-gray-400" />
          <div>
            <span className="block font-medium text-gray-800 dark:text-white/90">
              {inventario.parte?.nombre || "Sin parte"}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">{inventario.parte?.modelo || ""}</span>
          </div>
        </div>
      ),
    },
    {
      key: "cantidad",
      header: "Cantidad",
      render: (inventario) => {
        const bajoStock = inventario.cantidad < inventario.stockMinimo;
        return (
          <div className={`flex items-center gap-2 ${bajoStock ? "text-red-500" : "text-gray-500"}`}>
            <span className={`font-medium ${bajoStock ? "text-red-600 dark:text-red-400" : ""}`}>
              {inventario.cantidad}
            </span>
            {bajoStock && <ExclamationCircleIcon className="h-4 w-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: "stockMinimo",
      header: "Stock Minimo",
      render: (inventario) => inventario.stockMinimo,
    },
    {
      key: "ubicacion",
      header: "Ubicacion",
      render: (inventario) => (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <MapPinIcon className="h-4 w-4" />
          {inventario.ubicacion}
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (inventario) => (
        <Badge size="sm" color={inventario.estado ? "success" : "error"}>
          {inventario.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de inventario"
        data={inventarios}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchInventarios(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchInventarios(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchInventarios(page, 10, searchTerm, showInactive)}
        getRowKey={(inventario) => inventario.id}
        renderActions={(inventario) => {
          const estaActivo = inventario.estado;
          const isEditingStock = stockOperation.id === inventario.id;

          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleViewClick(inventario)}
                className="text-blue-500 hover:text-blue-600"
                title="Ver"
                aria-label="Ver detalles"
              >
                <EyeIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="text-yellow-500 hover:text-yellow-600"
                onClick={() => handleEditClick(inventario)}
                title="Editar"
                aria-label="Editar inventario"
              >
                <PencilIcon className="h-5 w-5" />
              </button>

              {!isEditingStock ? (
                <>
                  <button
                    type="button"
                    className="text-green-500 hover:text-green-600"
                    onClick={() => openStockOperation(inventario.id, "add")}
                    title="Anadir stock"
                    aria-label="Anadir stock"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => openStockOperation(inventario.id, "subtract")}
                    title="Restar stock"
                    aria-label="Restar stock"
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={stockOperation.amount}
                    onChange={(e) =>
                      setStockOperation((prev) => ({
                        ...prev,
                        amount: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleStockOperation}
                    className="text-green-500 hover:text-green-600"
                    title="Confirmar"
                    aria-label="Confirmar operacion"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={closeStockOperation}
                    className="text-red-500 hover:text-red-600"
                    title="Cancelar"
                    aria-label="Cancelar operacion"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                className={estaActivo ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                onClick={() => handleToggleEstado(inventario)}
                title={estaActivo ? "Deshabilitar" : "Habilitar"}
                aria-label={estaActivo ? "Deshabilitar inventario" : "Habilitar inventario"}
              >
                {estaActivo ? <TrashBinIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
              </button>
            </div>
          );
        }}
      />

      <div className="mt-4">
        <InventarioDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          inventario={selectedInventario}
        />
        <InventarioEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          inventario={selectedInventario}
          onSave={handleSaveInventario}
        />
        <ConfirmDialog
          isOpen={pendingToggleInventario !== null}
          title="Cambiar estado de inventario"
          description={
            pendingToggleInventario
              ? `¿Estás seguro de ${pendingToggleInventario.estado ? "deshabilitar" : "habilitar"} el registro de inventario de \"${pendingToggleInventario.parte?.nombre || "sin parte"}\"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleInventario(null)}
          confirmText={pendingToggleInventario?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleInventario?.estado ?? false}
        />
      </div>
    </>
  );
}
