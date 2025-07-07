'use client';

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import CasilleroDetailsModal from "../modals/CasilleroDetailsModal";
import CasilleroEditModal from "../modals/CasilleroEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Casillero, useCasillero } from "@/hooks/useCasillero";

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
    assignOrder,
    releaseCasillero,
  } = useCasillero();

  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [selectedCasillero, setSelectedCasillero] = useState<Casillero | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleToggleEstado = async (casillero: Casillero) => {
    const estaActivo = casillero.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    // Verificar que no se desactive un casillero ocupado
    if (estaActivo && casillero.situacion === 'Ocupado') {
      toast.error("No se puede desactivar un casillero ocupado");
      return;
    }

    const confirmacion = confirm(`¿Estás seguro de ${accion} este casillero?`);
    if (!confirmacion) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${casillero.id}/toggle-estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Casillero ${estaActivo ? 'deshabilitado' : 'habilitado'} correctamente`);
      fetchCasilleros(currentPage, 10, searchTerm, showInactive, situacionFilter);
    } catch (error) {
      console.error(`Error al ${accion} casillero:`, error);
      toast.error(`Error al ${accion} casillero`);
    }
  };

  const handleToggleOcupacion = async (casillero: Casillero) => {
    const estaOcupado = casillero.situacion === 'Ocupado';
    const accion = estaOcupado ? "liberar" : "asignar orden";

    const confirmacion = confirm(`¿Estás seguro de ${accion} este casillero?`);
    if (!confirmacion) return;

    try {
      if (estaOcupado) {
        await releaseCasillero(casillero.id);
        toast.success("Casillero liberado correctamente");
      } else {
        // Aquí podrías implementar un modal para seleccionar la orden a asignar
        // Por ahora lo dejamos como ejemplo
        toast.info("Implementar lógica para asignar orden");
        return;
      }

      fetchCasilleros(currentPage, 10, searchTerm, showInactive, situacionFilter);
    } catch (error) {
      console.error(`Error al ${accion} casillero:`, error);
      toast.error(`Error al ${accion} casillero`);
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
                htmlFor="buscarCasillero"
                className="text-base font-semibold text-gray-700 dark:text-white"
              >
                Buscar:
              </label>
              <div className="relative w-full sm:w-96">
                <input
                  id="buscarCasillero"
                  type="text"
                  placeholder="Por código o descripción..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setSearchTerm(valor);
                    fetchCasilleros(1, 10, valor, showInactive, situacionFilter);
                  }}
                  aria-label="Buscar casilleros"
                />
                {searchTerm && (
                  <button
                    title="Limpiar búsqueda"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchTerm("");
                      fetchCasilleros(1, 10, "", showInactive, situacionFilter);
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">Situación:</label>
              <select
                value={situacionFilter || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  setSituacionFilter(value as 'Disponible' | 'Ocupado' | undefined);
                  fetchCasilleros(1, 10, searchTerm, showInactive, value as 'Disponible' | 'Ocupado' | undefined);
                }}
                className="rounded-md border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="Disponible">Disponible</option>
                <option value="Ocupado">Ocupado</option>
              </select>
            </div>

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
              Mostrando {casilleros.length} de {totalItems} casilleros
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
                  Código
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Descripción
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Situación
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
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Cargando casilleros...
                  </TableCell>
                </TableRow>
              ) : casilleros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    {searchTerm ? "No se encontraron resultados" : "No hay casilleros disponibles."}
                  </TableCell>
                </TableRow>
              ) : (
                casilleros.map((casillero) => {
                  const estaActivo = casillero.estado;
                  const estaOcupado = casillero.situacion === 'Ocupado';
                  return (
                    <TableRow key={casillero.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {casillero.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {casillero.codigo}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="text-gray-500 dark:text-gray-400">
                          {casillero.descripcion}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge size="sm" color={estaOcupado ? "error" : "success"}>
                          {estaOcupado ? "Ocupado" : "Disponible"}
                        </Badge>
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
                            onClick={() => handleViewClick(casillero)}
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
                            onClick={() => handleEditClick(casillero)}
                            title="Editar"
                            aria-label="Editar casillero"
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

                          {/* Liberar/Asignar */}
                          <button
                            className={estaOcupado ? "text-green-500 hover:text-green-600" : "text-purple-500 hover:text-purple-600"}
                            onClick={() => handleToggleOcupacion(casillero)}
                            title={estaOcupado ? "Liberar" : "Asignar orden"}
                            aria-label={estaOcupado ? "Liberar casillero" : "Asignar orden a casillero"}
                          >
                            {estaOcupado ? (
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
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>

                          {/* Deshabilitar/Habilitar */}
                          <button
                            className={estaActivo ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                            onClick={() => handleToggleEstado(casillero)}
                            title={estaActivo ? "Deshabilitar" : "Habilitar"}
                            aria-label={estaActivo ? "Deshabilitar casillero" : "Habilitar casillero"}
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
                onClick={() => fetchCasilleros(currentPage - 1, 10, searchTerm, showInactive, situacionFilter)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchCasilleros(page, 10, searchTerm, showInactive, situacionFilter)}
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
                onClick={() => fetchCasilleros(currentPage + 1, 10, searchTerm, showInactive, situacionFilter)}
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
        <CasilleroDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          casillero={selectedCasillero}
        />
        <CasilleroEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          casillero={selectedCasillero}
          onSave={handleSaveCasillero}
        />
      </div>
    </div>
  );
}