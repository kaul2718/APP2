'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import ParteDetailsModal from "../modals/ParteDetailsModal";
import ParteEditModal from "../modals/ParteEditModal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Parte, usePartes } from "@/hooks/usePartes";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

export default function ParteTable() {
  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));
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
  const [pendingToggleParte, setPendingToggleParte] = useState<Parte | null>(null);

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

  const handleToggleEstado = (parte: Parte) => {
    setPendingToggleParte(parte);
  };

  const confirmToggleEstado = async () => {
    if (!pendingToggleParte) return;

    const parte = pendingToggleParte;
    const estaActivo = parte.estado;
    const accion = estaActivo ? "deshabilitar" : "habilitar";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${parte.id}/toggle-estado`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      toast.success(`Ítem ${estaActivo ? "deshabilitado" : "habilitado"} correctamente`);
      fetchPartes(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al ${accion} el ítem:`, error);
      toast.error(`Error al ${accion} el ítem`);
    } finally {
      setPendingToggleParte(null);
    }
  };

  const columns: ColumnDef<Parte>[] = [
    {
      key: "id",
      header: "ID",
      render: (parte) => parte.id,
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (parte) => parte.nombre,
    },
    {
      key: "modelo",
      header: "Modelo",
      render: (parte) => parte.modelo,
    },
    {
      key: "codigoInterno",
      header: "Código",
      render: (parte) => parte.codigoInterno || "Auto",
    },
    {
      key: "precioReferencia",
      header: "Precio Ref.",
      render: (parte) => formatCurrency(parte.precioReferencia),
    },
    {
      key: "descripcion",
      header: "Descripcion",
      render: (parte) => <span className="line-clamp-1">{parte.descripcion}</span>,
    },
    {
      key: "categoria",
      header: "Categoria",
      render: (parte) => parte.categoria?.nombre || "Sin categoria",
    },
    {
      key: "marca",
      header: "Marca",
      render: (parte) => parte.marca?.nombre || "Sin marca",
    },
    {
      key: "estado",
      header: "Estado",
      render: (parte) => (
        <Badge size="sm" color={parte.estado ? "success" : "error"}>
          {parte.estado ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  const rowActions = (parte: Parte): ActionDef[] => [
    {
      key: "view",
      label: "Ver",
      onClick: () => handleViewClick(parte),
      className:
        "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
    },
    {
      key: "edit",
      label: "Editar",
      onClick: () => handleEditClick(parte),
      className:
        "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
    },
    {
      key: "toggle",
      label: parte.estado ? "Deshabilitar" : "Habilitar",
      onClick: () => handleToggleEstado(parte),
      className: parte.estado
        ? "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        : "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20",
    },
  ];

  return (
    <>
      <DataTable
        caption="Tabla del catálogo de ítems"
        data={partes}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchPartes(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchPartes(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchPartes(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(parte) => parte.id}
      />

      <div className="mt-4">
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
        <ConfirmDialog
          isOpen={pendingToggleParte !== null}
          title="Cambiar estado del ítem"
          description={
            pendingToggleParte
              ? `¿Estás seguro de ${pendingToggleParte.estado ? "deshabilitar" : "habilitar"} el ítem "${pendingToggleParte.nombre}"?`
              : ""
          }
          onConfirm={confirmToggleEstado}
          onClose={() => setPendingToggleParte(null)}
          confirmText={pendingToggleParte?.estado ? "Deshabilitar" : "Habilitar"}
          destructive={pendingToggleParte?.estado ?? false}
        />
      </div>
    </>
  );
}
