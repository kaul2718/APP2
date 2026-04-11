'use client';
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ClientDetailsModal from "../modals/ClientDetailsModal";
import ClientEditModal from "../modals/ClientEditModal";
import { Cliente, useClientes } from "@/hooks/useClientes";
import { ActionDef, ColumnDef, DataTable } from "./DataTable";

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

  const columns: ColumnDef<Cliente>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (cliente) => cliente.nombre,
    },
    {
      key: "cedula",
      header: "Cedula",
      render: (cliente) => cliente.cedula,
    },
    {
      key: "correo",
      header: "Correo",
      render: (cliente) => cliente.correo,
    },
    {
      key: "rol",
      header: "Rol",
      render: (cliente) => (
        <Badge size="sm" color={cliente.role === "admin" ? "primary" : "info"}>
          {cliente.role}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (cliente) => (
        <Badge size="sm" color={cliente.estado ? "success" : "error"}>
          {cliente.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const actions = (cliente: Cliente): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(cliente),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(cliente),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: cliente.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(cliente),
      className: cliente.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla de usuarios"
        data={clientes}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          fetchClientes(1, 10, value, showDisabled);
        }}
        showInactive={showDisabled}
        onToggleInactive={() => {
          const next = !showDisabled;
          setShowDisabled(next);
          fetchClientes(1, 10, searchTerm, next);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchClientes(page, 10, searchTerm, showDisabled)}
        actions={actions}
        getRowKey={(cliente) => cliente.id}
      />

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
    </>
  );
}