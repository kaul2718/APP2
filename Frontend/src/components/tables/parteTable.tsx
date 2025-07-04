'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import ParteDetailsModal from "../modals/ParteDetailsModal";
import ParteEditModal from "../modals/ParteEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Parte, usePartes } from "@/hooks/usePartes";

export default function ParteTable() {
  const {
    partes,
    loading,
    setPartes,
    fetchPartes,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showInactive,
    setShowInactive,
  } = usePartes();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedParte, setSelectedParte] = useState<Parte | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewClick = (parte: Parte) => {
    setSelectedParte(parte);
    setIsModalOpen(true);
  };

  const handleEditClick = (parte: Parte) => {
    setSelectedParte(parte);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParte(null);
  };

  const handleSaveParte = (parteActualizado: Parte) => {
    setPartes((prev) => prev.map((p) => (p.id === parteActualizado.id ? parteActualizado : p)));
    fetchPartes(currentPage, 10, searchTerm, showInactive);
  };

  const handleToggleEstado = async (parte: Parte) => {
    const estaActivo = parte.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    const confirmacion = confirm(`¿Estás seguro de ${accion} esta parte?`);
    if (!confirmacion) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${parte.id}/toggle-estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Parte ${estaActivo ? 'deshabilitada' : 'habilitada'} correctamente`);
      fetchPartes(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} parte:`, error);
      toast.error(`Error al ${accion} parte`);
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
                htmlFor="buscarParte"
                className="text-base font-semibold text-gray-700 dark:text-white"
              >
                Buscar:
              </label>
              <div className="relative w-full sm:w-96">
                <input
                  id="buscarParte"
                  type="text"
                  placeholder="Por nombre, modelo o descripción..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setSearchTerm(valor);
                    fetchPartes(1, 10, valor, showInactive);
                  }}
                  aria-label="Buscar partes"
                />
                {searchTerm && (
                  <button
                    title="Limpiar búsqueda"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchTerm("");
                      fetchPartes(1, 10, "", showInactive);
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
              Mostrando {partes.length} de {totalItems} partes
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
                  Modelo
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Descripción
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Categoría
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
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    Cargando partes...
                  </TableCell>
                </TableRow>
              ) : partes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    {searchTerm ? "No se encontraron resultados" : "No hay partes disponibles."}
                  </TableCell>
                </TableRow>
              ) : (
                partes.map((parte) => {
                  const estaActivo = parte.estado;
                  return (
                    <TableRow key={parte.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {parte.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {parte.nombre}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="text-gray-500 dark:text-gray-400">
                          {parte.modelo}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="text-gray-500 dark:text-gray-400 line-clamp-1">
                          {parte.descripcion}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="text-gray-500 dark:text-gray-400">
                          {parte.categoria?.nombre || 'Sin categoría'}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="text-gray-500 dark:text-gray-400">
                          {parte.marca?.nombre || 'Sin marca'}
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
                            onClick={() => handleViewClick(parte)}
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
                            onClick={() => handleEditClick(parte)}
                            title="Editar"
                            aria-label="Editar parte"
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
                            onClick={() => handleToggleEstado(parte)}
                            title={estaActivo ? "Deshabilitar" : "Habilitar"}
                            aria-label={estaActivo ? "Deshabilitar parte" : "Habilitar parte"}
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
                onClick={() => fetchPartes(currentPage - 1, 10, searchTerm, showInactive)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchPartes(page, 10, searchTerm, showInactive)}
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
                onClick={() => fetchPartes(currentPage + 1, 10, searchTerm, showInactive)}
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
        <ParteDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          parte={selectedParte}
        />
        <ParteEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          parte={selectedParte}
          onSave={handleSaveParte}
        />
      </div>
    </div>
  );
}