'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import ModeloDetailsModal from "../modals/ModeloDetailsModal";
import ModeloEditModal from "../modals/ModeloEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Modelo, useModelo } from "@/hooks/useModelo";

export default function ModeloTable() {
  const {
    modelos,
    loading,
    setModelos,
    fetchModelos,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
  } = useModelo();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewClick = (modelo: Modelo) => {
    setSelectedModelo(modelo);
    setIsModalOpen(true);
  };

  const handleEditClick = (modelo: Modelo) => {
    setSelectedModelo(modelo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModelo(null);
  };

  const handleSaveModelo = (modeloActualizado: Modelo) => {
    setModelos((prev) => prev.map((m) => (m.id === modeloActualizado.id ? modeloActualizado : m)));
    fetchModelos(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = async (modelo: Modelo) => {
    const estaActivo = modelo.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    const confirmacion = confirm(`¿Estás seguro de ${accion} este modelo?`);
    if (!confirmacion) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${modelo.id}/toggle-estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Modelo ${estaActivo ? 'deshabilitado' : 'habilitado'} correctamente`);
      fetchModelos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} modelo:`, error);
      toast.error(`Error al ${accion} modelo`);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Search and Filter Section */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-2">
              <label
                htmlFor="buscarModelo"
                className="text-base font-semibold text-gray-700 dark:text-white"
              >
                Buscar:
              </label>
              <div className="relative w-full sm:w-96">
                <input
                  id="buscarModelo"
                  type="text"
                  placeholder="Por nombre..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setSearchTerm(valor);
                    fetchModelos(1, 10, valor, showInactive);
                  }}
                  aria-label="Buscar modelos"
                />
                {searchTerm && (
                  <button
                    title="Limpiar búsqueda"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchTerm("");
                      fetchModelos(1, 10, "", showInactive);
                    }}
                    aria-label="Limpiar búsqueda"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
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
              Mostrando {modelos.length} de {totalItems} modelos
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
                  Nombre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Marca
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
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Cargando modelos...
                  </TableCell>
                </TableRow>
              ) : modelos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    {searchTerm ? "No se encontraron resultados" : "No hay modelos disponibles."}
                  </TableCell>
                </TableRow>
              ) : (
                modelos.map((modelo) => {
                  const estaActivo = modelo.estado;
                  return (
                    <TableRow key={modelo.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {modelo.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {modelo.nombre}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="text-gray-500 dark:text-gray-400">
                          {modelo.marca?.nombre || 'Sin marca'}
                        </span>
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
                            onClick={() => handleViewClick(modelo)}
                            className="text-blue-500 hover:text-blue-600"
                            title="Ver"
                            aria-label="Ver detalles"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Editar */}
                          <button
                            className="text-yellow-500 hover:text-yellow-600"
                            onClick={() => handleEditClick(modelo)}
                            title="Editar"
                            aria-label="Editar modelo"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536l-12.5 12.5H4v-4.5l12.5-12.5z" />
                            </svg>
                          </button>

                          {/* Deshabilitar/Habilitar */}
                          <button
                            className={estaActivo ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                            onClick={() => handleToggleEstado(modelo)}
                            title={estaActivo ? "Deshabilitar" : "Habilitar"}
                            aria-label={estaActivo ? "Deshabilitar modelo" : "Habilitar modelo"}
                          >
                            {estaActivo ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
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
                onClick={() => fetchModelos(currentPage - 1, 10, searchTerm, showInactive)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchModelos(page, 10, searchTerm, showInactive)}
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
                onClick={() => fetchModelos(currentPage + 1, 10, searchTerm, showInactive)}
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
        <ModeloDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          modelo={selectedModelo}
        />
        <ModeloEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          modelo={selectedModelo}
          onSave={handleSaveModelo}
        />
      </div>
    </div>
  );
}