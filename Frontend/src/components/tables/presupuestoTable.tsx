'use client';

import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import PresupuestoDetailsModal from "../modals/PresupuestoDetailsModal";
import PresupuestoEditModal from "../modals/PresupuestoEditModal";
import { toast } from "react-toastify";
import { usePresupuesto, Presupuesto, ResumenPresupuesto } from "@/hooks/usePresupuesto";
import { DocumentTextIcon, HashtagIcon, UserIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { DataTable, ColumnDef, ActionDef } from "./DataTable";

type PresupuestoRow = Presupuesto & {
  deletedAt?: string | null;
  orden?: (Presupuesto["orden"] & {
    client?: {
      nombre?: string;
      apellido?: string;
    };
  }) | null;
};

export default function PresupuestoTable() {
  const {
    presupuestos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    fetchPresupuestos,
    deletePresupuesto,
    restorePresupuesto,
    updatePresupuesto,
    setSearchTerm,
    getResumenPresupuesto,
  } = usePresupuesto();

  const router = useRouter();

  const [selectedPresupuesto, setSelectedPresupuesto] = useState<PresupuestoRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [resumen, setResumen] = useState<ResumenPresupuesto | null>(null);

  const handleViewClick = async (presupuesto: PresupuestoRow) => {
    try {
      const resumenData = await getResumenPresupuesto(presupuesto.id);
      setResumen(resumenData);
      setSelectedPresupuesto(presupuesto);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Error al cargar el resumen del presupuesto");
      console.error(error);
    }
  };

  const handleEditClick = (presupuesto: PresupuestoRow) => {
    setSelectedPresupuesto(presupuesto);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (presupuesto: PresupuestoRow) => {
    setSelectedPresupuesto(presupuesto);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPresupuesto(null);
    setResumen(null);
  };

  const handleSavePresupuesto = async (presupuestoActualizado: Presupuesto) => {
    try {
      await updatePresupuesto(presupuestoActualizado.id, {
        descripcion: presupuestoActualizado.descripcion || undefined,
        estadoId: presupuestoActualizado.estadoId,
        ordenId: presupuestoActualizado.ordenId,
      });

      fetchPresupuestos(currentPage, 10, searchTerm);
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error);
      toast.error("No se pudo actualizar el presupuesto");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPresupuesto) return;

    try {
      await deletePresupuesto(selectedPresupuesto.id);
      fetchPresupuestos(Number(currentPage), 10, searchTerm);
    } catch (error) {
      toast.error("Error al eliminar presupuesto");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedPresupuesto(null);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedPresupuesto?.deletedAt) return;

    try {
      await restorePresupuesto(selectedPresupuesto.id);
      toast.success("Presupuesto restaurado correctamente");
      fetchPresupuestos(Number(currentPage), 10, searchTerm);
    } catch (error) {
      toast.error("Error al restaurar presupuesto");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedPresupuesto(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("es-AR", options);
  };

  const calculateTotal = (presupuesto: Presupuesto) => {
    const detallesItems = Array.isArray(presupuesto.detallesPresupuestoItems) ? presupuesto.detallesPresupuestoItems : [];
    const detallesManoObra = Array.isArray(presupuesto.detallesManoObra) ? presupuesto.detallesManoObra : [];

    const totalItems = detallesItems
      .filter((detalle) => detalle?.estado !== false)
      .reduce((sum, detalle) => {
        const subtotal = Number(detalle?.subtotal) || (Number(detalle?.precioUnitario) || 0) * (Number(detalle?.cantidad) || 0);
        return sum + subtotal;
      }, 0);

    const totalManoObra = detallesManoObra
      .filter((detalle) => detalle?.estado !== false)
      .reduce((sum, detalle) => {
        const costo = Number(detalle?.costoTotal) || (Number(detalle?.costoUnitario) || 0) * (Number(detalle?.cantidad) || 0);
        return sum + costo;
      }, 0);

    return totalItems + totalManoObra;
  };

  const columns: ColumnDef<PresupuestoRow>[] = [
    {
      key: "id",
      header: "ID",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <HashtagIcon className="h-4 w-4 text-gray-400" />
          {presupuesto.id}
        </div>
      ),
    },
    {
      key: "orden",
      header: "Orden",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-4 w-4 text-gray-400" />
          <span
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            onClick={() => router.push(`/ver-orden/${presupuesto.ordenId}`)}
          >
            #{presupuesto.orden?.workOrderNumber}
          </span>
        </div>
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span>
            {presupuesto.orden?.client?.nombre || "Cliente no disponible"} {presupuesto.orden?.client?.apellido}
          </span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (presupuesto) => (
        <Badge
          size="sm"
          color={
            presupuesto.estado?.nombre === "Aprobado"
              ? "success"
              : presupuesto.estado?.nombre === "Rechazado"
                ? "error"
                : "warning"
          }
        >
          {presupuesto.estado?.nombre || "Sin estado"}
        </Badge>
      ),
    },
    {
      key: "fechaEmision",
      header: "Fecha Emision",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400">{formatDate(presupuesto.fechaEmision)}</span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (presupuesto) => <span className="font-medium">{formatCurrency(calculateTotal(presupuesto))}</span>,
    },
  ];

  const rowActions = (presupuesto: PresupuestoRow): ActionDef[] => {
    const estaEliminado = !!presupuesto.deletedAt;

    return [
      {
        key: "view",
        label: "Ver",
        onClick: () => {
          void handleViewClick(presupuesto);
        },
        className:
          "rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20",
      },
      {
        key: "edit",
        label: "Editar",
        onClick: () => handleEditClick(presupuesto),
        disabled: estaEliminado,
        className:
          "rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-40 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20",
      },
      {
        key: "delete-restore",
        label: estaEliminado ? "Restaurar" : "Eliminar",
        onClick: () => handleDeleteClick(presupuesto),
        className: estaEliminado
          ? "rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
          : "rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20",
      },
    ];
  };

  return (
    <>
      <DataTable
        caption="Tabla de presupuestos"
        data={presupuestos as PresupuestoRow[]}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchPresupuestos(1, 10, term);
        }}
        showInactive={false}
        onToggleInactive={() => {
          // Presupuestos no usa este filtro por ahora.
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchPresupuestos(page, 10, searchTerm)}
        actions={rowActions}
        getRowKey={(presupuesto) => presupuesto.id}
      />

      <div className="mt-4">
        <PresupuestoDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          presupuesto={selectedPresupuesto}
          resumen={resumen}
        />

        <PresupuestoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          presupuesto={selectedPresupuesto}
          onSave={handleSavePresupuesto}
        />
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title={selectedPresupuesto?.deletedAt ? "Restaurar presupuesto" : "Eliminar presupuesto"}
        description={
          selectedPresupuesto?.deletedAt
            ? "¿Estás seguro de que deseas restaurar este presupuesto?"
            : "¿Estás seguro de que deseas eliminar este presupuesto?"
        }
        onConfirm={selectedPresupuesto?.deletedAt ? handleRestoreConfirm : handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPresupuesto(null);
        }}
        confirmText={selectedPresupuesto?.deletedAt ? "Restaurar" : "Eliminar"}
        destructive={!selectedPresupuesto?.deletedAt}
      />
    </>
  );
}
