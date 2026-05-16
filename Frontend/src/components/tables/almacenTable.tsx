'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import AlmacenDetailsModal from "../modals/AlmacenDetailsModal";
import AlmacenEditModal from "../modals/AlmacenEditModal";
import { toast } from "react-toastify";
import { ItemAlmacen, useAlmacen } from "@/hooks/useAlmacen";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";
import {
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  TagIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import ExclamationTriangleIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";

interface AlmacenTableProps {
  almacenHook?: any;
  onDataChange?: () => void;
}

export default function AlmacenTable({ almacenHook, onDataChange }: AlmacenTableProps) {
  const internalHook = useAlmacen();
  const hook = almacenHook || internalHook;

  const {
    items,
    loading,
    setItems,
    fetchItems,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
    toggleItemStatus,
  } = hook;

  const [selectedItem, setSelectedItem] = useState<ItemAlmacen | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingToggleItem, setPendingToggleItem] = useState<ItemAlmacen | null>(null);

  const handleViewClick = (item: ItemAlmacen) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: ItemAlmacen) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveItem = (itemActualizado: ItemAlmacen) => {
    setItems((prev: ItemAlmacen[]) => prev.map((p) => (p.id === itemActualizado.id ? itemActualizado : p)));
    fetchItems(currentPage, 10, searchTerm, showInactive);
    onDataChange?.();
  };

  const handleToggleEstado = (item: ItemAlmacen) => {
    setPendingToggleItem(item);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleItem) return;

    const item = pendingToggleItem;
    const estaActivo = item.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      await toggleItemStatus(item.id);
      toast.success(`Item ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchItems(currentPage, 10, searchTerm, showInactive);
      onDataChange?.();
    } catch (error) {
      console.error(`Error al ${accion} el item:`, error);
      toast.error(`Error al ${accion} el item`);
    } finally {
      setPendingToggleItem(null);
    }
  };

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

  const columns: ColumnDef<ItemAlmacen>[] = [
    {
      key: "nombre",
      header: "Producto / Identificación",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
              {item.nombre}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-mono">
                {item.codigoInterno || 'SIN-COD'}
              </span>
              <span className="text-[10px] text-gray-500 italic truncate">
                {item.modelo || 'S/M'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Existencias",
      render: (item) => {
        const stockValue = Number(item.stock);
        const minStock = Number(item.stockMinimo);
        const unidad = item.unidadMedida || "Unidad";

        const isZero = stockValue <= 0;
        const isLow = stockValue <= minStock && !isZero;
        const isNearLow = stockValue <= (minStock + 5) && !isLow && !isZero;

        // Format stock value
        const displayStock = (unidad === "Unidad" || unidad === "Servicio")
          ? Math.floor(stockValue).toString()
          : (stockValue % 1 === 0 ? stockValue.toString() : stockValue.toLocaleString("es-EC", { maximumFractionDigits: 2 }));

        // Pluralization logic (including 0 as requested)
        const displayUnidad = ((unidad === "Unidad" || unidad === "Servicio") && (stockValue > 1 || isZero))
          ? (unidad === "Unidad" ? "UNIDADES" : "SERVICIOS")
          : unidad;

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${
                  isZero ? 'text-red-600' :
                  isLow ? 'text-amber-600' :
                  isNearLow ? 'text-yellow-600' :
                  'text-gray-900 dark:text-white'
                }`}>
                {displayStock} <span className="text-[10px] font-medium text-gray-500 uppercase">{displayUnidad}</span>
              </span>

              {isZero ? (
                <Badge size="sm" color="error" variant="light" className="animate-pulse">Agotado</Badge>
              ) : isLow ? (
                <Badge size="sm" color="warning" variant="light" className="flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-3 h-3 text-amber-500" />
                  Crítico
                </Badge>
              ) : isNearLow ? (
                <Badge size="sm" color="warning" variant="light" className="opacity-80">
                  Por Agotarse
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
              <MapPinIcon className="h-3 w-3" />
              {item.ubicacion || 'No asignada'}
            </div>
          </div>
        );
      }
    },
    {
      key: "precios",
      header: "Costos / Precios",
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-400 w-10">Costo:</span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {formatCurrency(item.costo)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-brand-500 w-10">PVP (1):</span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(item.precio1)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "categoria",
      header: "Clasificación",
      render: (item) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
            <TagIcon className="h-3 w-3 text-gray-400" />
            {item.categoria?.nombre || 'General'}
          </div>
          <div className="text-[10px] text-gray-500">
            {item.marca?.nombre || 'Genérica'}
          </div>
        </div>
      )
    },
    {
      key: "estado",
      header: "Estado",
      render: (item) => (
        <Badge size="sm" variant="light" color={item.estado ? "success" : "error"}>
          {item.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (item: ItemAlmacen): ActionDef[] => [
    {
      key: "view",
      label: <EyeIcon className="h-4 w-4" />,
      text: "Ficha técnica",
      onClick: () => handleViewClick(item),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
    },
    {
      key: "edit",
      label: <PencilSquareIcon className="h-4 w-4" />,
      text: "Editar precios/stock",
      onClick: () => handleEditClick(item),
      className:
        "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
    },
    {
      key: "toggle",
      label: item.estado ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />,
      text: item.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(item),
      className: item.estado
        ? "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        : "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors",
    },
  ];

  return (
    <>
      <DataTable
        caption="Gestión centralizada de inventario y precios"
        data={items}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchItems(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchItems(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchItems(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(item) => item.id}
      />

      <div className="mt-4">
        <AlmacenDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          parte={selectedItem}
        />
        <AlmacenEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          parte={selectedItem}
          onSave={handleSaveItem}
        />
        <ConfirmDialog
          isOpen={pendingToggleItem !== null}
          title="Cambiar estado del producto"
          description={
            pendingToggleItem
              ? `¿Estás seguro de ${pendingToggleItem.estado ? "deshabilitar" : "habilitar"} el producto "${pendingToggleItem.nombre}"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleItem(null)}
          confirmText={pendingToggleItem?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleItem?.estado ?? false}
        />
      </div>
    </>
  );
}
