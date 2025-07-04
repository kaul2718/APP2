'use client';
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import ClientDetailsModal from "../modals/ClientDetailsModal";
import ClientEditModal from "../modals/ClientEditModal";
import { Cliente, useClientes } from "@/hooks/useClientes";

export default function UsuarioTable() {
  const {
    clientes,
    loading,
    fetchClientes,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    setSearchTerm,
    showDisabled,
    setShowDisabled,
    toggleEstado,
  } = useClientes();

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleEditClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCliente(null);
  };

  const handleSaveCliente = (clienteActualizado: Cliente) => {
    fetchClientes(currentPage, 10, searchTerm, showDisabled);
  };

  const handleToggleEstado = async (cliente: Cliente) => {
    await toggleEstado(cliente);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Search and Filter Section */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-2">
              <label
                htmlFor="buscarInput"
                className="text-base font-semibold text-gray-700 dark:text-white"
              >
                Buscar:
              </label>
              <div className="relative w-full sm:w-96">
                <input
                  id="buscarInput"
                  type="text"
                  placeholder="Por nombre, cédula, rol, estado..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    fetchClientes(1, 10, e.target.value, showDisabled);
                  }}
                  aria-label="Buscar usuarios"
                />
                {searchTerm && (
                  <button
                    title="Limpiar búsqueda"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchTerm("");
                      fetchClientes(1, 10, "", showDisabled);
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
          <div className="flex items-center justify-start sm:justify-end w-full text-sm text-gray-500 dark:text-gray-400">
            Mostrando {clientes.length} de {totalItems} usuarios
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Nombre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Cédula
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Correo
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Rol
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    {searchTerm ? "No se encontraron resultados" : "No hay usuarios disponibles."}
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {cliente.nombre}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {cliente.cedula}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {cliente.correo}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge size="sm" color={cliente.role === 'ADMIN' ? 'primary' : 'secondary'}>
                        {cliente.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge size="sm" color={cliente.estado ? "success" : "error"}>
                        {cliente.estado ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        {/* Ver */}
                        <button
                          onClick={() => handleViewClick(cliente)}
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
                          onClick={() => handleEditClick(cliente)}
                          title="Editar"
                          aria-label="Editar usuario"
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

                        {/* Toggle Estado */}
                        <button
                          className={cliente.estado ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                          onClick={() => handleToggleEstado(cliente)}
                          title={cliente.estado ? "Deshabilitar" : "Habilitar"}
                          aria-label={cliente.estado ? "Deshabilitar usuario" : "Habilitar usuario"}
                        >
                          {cliente.estado ? (
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
                ))
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
                onClick={() => fetchClientes(currentPage - 1, 10, searchTerm, showDisabled)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchClientes(page, 10, searchTerm, showDisabled)}
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
                onClick={() => fetchClientes(currentPage + 1, 10, searchTerm, showDisabled)}
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
        <ClientDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          cliente={selectedCliente}
        />
        <ClientEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          cliente={selectedCliente}
          onSave={handleSaveCliente}
        />
      </div>
    </div>
  );
}