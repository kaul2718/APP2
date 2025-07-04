'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import InventarioDetailsModal from "../modals/InventarioDetailsModal";
import InventarioEditModal from "../modals/InventarioEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Inventario, useInventario } from "@/hooks/useInventario";
import { CubeIcon, MapPinIcon, CheckIcon, XMarkIcon, PencilIcon, EyeIcon, ExclamationCircleIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { TrashBinIcon } from "@/icons";

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
    updateStock
  } = useInventario();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedInventario, setSelectedInventario] = useState<Inventario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stockOperation, setStockOperation] = useState<{ id: number | null, type: 'add' | 'subtract', amount: number }>({
    id: null,
    type: 'add',
    amount: 1
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
    setInventarios((prev) =>
      prev.map((i) => (i.id === inventarioActualizado.id ? inventarioActualizado : i))
    );
    fetchInventarios(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = async (inventario: Inventario) => {
    const estaActivo = inventario.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    const confirmacion = confirm(`¿Estás seguro de ${accion} este registro de inventario?`);
    if (!confirmacion) return;

    try {
      await toggleInventarioStatus(inventario.id);
      fetchInventarios(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} inventario:`, error);
      toast.error(`Error al ${accion} inventario`);
    }
  };

  const handleStockOperation = async () => {
    if (!stockOperation.id || stockOperation.amount <= 0) return;

    try {
      await updateStock(stockOperation.id, stockOperation.amount, stockOperation.type);
      setStockOperation({ id: null, type: 'add', amount: 1 });
      fetchInventarios(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar stock');
    }
  };

  const openStockOperation = (id: number, type: 'add' | 'subtract') => {
    setStockOperation({
      id,
      type,
      amount: 1
    });
  };

  const closeStockOperation = () => {
    setStockOperation({
      id: null,
      type: 'add',
      amount: 1
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Search and Filter Section */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-2">
              <label
                htmlFor="buscarInventario"
                className="text-base font-semibold text-gray-700 dark:text-white"
              >
                Buscar:
              </label>
              <div className="relative w-full sm:w-96">
                <input
                  id="buscarInventario"
                  type="text"
                  placeholder="Por parte o ubicación..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setSearchTerm(valor);
                    fetchInventarios(1, 10, valor, showInactive);
                  }}
                  aria-label="Buscar inventario"
                />
                {searchTerm && (
                  <button
                    title="Limpiar búsqueda"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchTerm("");
                      fetchInventarios(1, 10, "", showInactive);
                    }}
                    aria-label="Limpiar búsqueda"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
              Mostrar inactivos
            </label>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {inventarios.length} de {totalItems} registros
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  ID
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Parte
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Cantidad
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Stock Mínimo
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Ubicación
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    Cargando inventario...
                  </TableCell>
                </TableRow>
              ) : inventarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    {searchTerm ? "No se encontraron resultados" : "No hay registros de inventario disponibles."}
                  </TableCell>
                </TableRow>
              ) : (
                inventarios.map((inventario) => {
                  const estaActivo = inventario.estado;
                  const bajoStock = inventario.cantidad < inventario.stockMinimo;
                  const isEditingStock = stockOperation.id === inventario.id;

                  return (
                    <TableRow key={inventario.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {inventario.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <CubeIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {inventario.parte?.nombre || 'Sin parte'}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {inventario.parte?.modelo || ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className={`flex items-center gap-2 ${bajoStock ? 'text-red-500' : 'text-gray-500'}`}>
                          <span className={`font-medium ${bajoStock ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {inventario.cantidad}
                          </span>
                          {bajoStock && (
                            <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 dark:text-gray-400">
                        {inventario.stockMinimo}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="h-4 w-4" />
                          {inventario.ubicacion}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge size="sm" color={estaActivo ? "success" : "error"}>
                          {estaActivo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          {/* Ver */}
                          <button
                            onClick={() => handleViewClick(inventario)}
                            className="text-blue-500 hover:text-blue-600"
                            title="Ver"
                            aria-label="Ver detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>

                          {/* Editar */}
                          <button
                            className="text-yellow-500 hover:text-yellow-600"
                            onClick={() => handleEditClick(inventario)}
                            title="Editar"
                            aria-label="Editar inventario"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>

                          {/* Operaciones de stock */}
                          {!isEditingStock ? (
                            <>
                              <button
                                className="text-green-500 hover:text-green-600"
                                onClick={() => openStockOperation(inventario.id, 'add')}
                                title="Añadir stock"
                                aria-label="Añadir stock"
                              >
                                <PlusIcon className="w-5 h-5" />
                              </button>
                              <button
                                className="text-red-500 hover:text-red-600"
                                onClick={() => openStockOperation(inventario.id, 'subtract')}
                                title="Restar stock"
                                aria-label="Restar stock"
                              >
                                <MinusIcon className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={stockOperation.amount}
                                onChange={(e) => setStockOperation(prev => ({
                                  ...prev,
                                  amount: Math.max(1, Number(e.target.value))
                                }))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600"
                              />
                              <button
                                onClick={handleStockOperation}
                                className="text-green-500 hover:text-green-600"
                                title="Confirmar"
                                aria-label="Confirmar operación"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={closeStockOperation}
                                className="text-red-500 hover:text-red-600"
                                title="Cancelar"
                                aria-label="Cancelar operación"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          )}

                          {/* Deshabilitar/Habilitar */}
                          <button
                            className={estaActivo ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                            onClick={() => handleToggleEstado(inventario)}
                            title={estaActivo ? "Deshabilitar" : "Habilitar"}
                            aria-label={estaActivo ? "Deshabilitar inventario" : "Habilitar inventario"}
                          >
                            {estaActivo ? (
                              <TrashBinIcon className="w-5 h-5" />
                            ) : (
                              <CheckIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
            <div className="mb-4 sm:mb-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInventarios(currentPage - 1, 10, searchTerm, showInactive)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchInventarios(page, 10, searchTerm, showInactive)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  aria-label={`Ir a página ${page}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => fetchInventarios(currentPage + 1, 10, searchTerm, showInactive)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Página siguiente"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
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
      </div>
    </div>
  );
}