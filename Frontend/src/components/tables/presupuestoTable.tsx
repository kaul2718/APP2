'use client';
 
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import ConfirmDialog from "../modals/ConfirmDialog";
import PresupuestoDetailsModal from "../modals/PresupuestoDetailsModal";
import PresupuestoEditModal from "../modals/PresupuestoEditModal";
import { toast } from "react-toastify";
import { usePresupuesto, Presupuesto, ResumenPresupuesto } from "@/hooks/usePresupuesto";
import { 
  DocumentTextIcon, 
  UserIcon, 
  CalendarIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  BanknotesIcon,
  HashtagIcon
} from "@heroicons/react/24/outline";
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

interface PresupuestoTableProps {
  presupuestoHook?: any;
}

export default function PresupuestoTable({ presupuestoHook }: PresupuestoTableProps) {
  const internalHook = usePresupuesto();
  const hook = presupuestoHook || internalHook;

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
    setShowInactive,
    showInactive
  } = hook;

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

      fetchPresupuestos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error);
      toast.error("No se pudo actualizar el presupuesto");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPresupuesto) return;

    try {
      await deletePresupuesto(selectedPresupuesto.id);
      fetchPresupuestos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      toast.error("Error al eliminar presupuesto");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedPresupuesto(null);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedPresupuesto) return;

    try {
      await restorePresupuesto(selectedPresupuesto.id);
      fetchPresupuestos(currentPage, 10, searchTerm, showInactive);
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

    return detallesItems
      .filter((detalle) => detalle?.estado !== false)
      .reduce((sum, detalle) => {
        const subtotal = Number(detalle?.subtotal) || (Number(detalle?.precioUnitario) || 0) * (Number(detalle?.cantidad) || 0);
        return sum + subtotal;
      }, 0);
  };

  const columns: ColumnDef<PresupuestoRow>[] = [
    {
      key: "id",
      header: "Código / ID",
      render: (presupuesto) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <HashtagIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              PR-{String(presupuesto.id).padStart(4, '0')}
            </p>
            <p className="text-xs text-gray-500">ID Interno: #{presupuesto.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "orden",
      header: "Orden Relacionada",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <button
            onClick={() => router.push(`/ver-orden/${presupuesto.ordenId}`)}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            {presupuesto.orden?.workOrderNumber || `Orden #${presupuesto.ordenId}`}
          </button>
        </div>
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {presupuesto.orden?.client?.nombre || "N/A"} {presupuesto.orden?.client?.apellido || ""}
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
          variant="light"
          color={
            presupuesto.estado?.nombre.toLowerCase() === "aprobado"
              ? "success"
              : presupuesto.estado?.nombre.toLowerCase() === "rechazado" || presupuesto.estado?.nombre.toLowerCase() === "cancelado"
                ? "error"
                : "warning"
          }
        >
          {presupuesto.estado?.nombre || "Pendiente"}
        </Badge>
      ),
    },
    {
      key: "fechaEmision",
      header: "Fecha Emisión",
      render: (presupuesto) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(presupuesto.fechaEmision)}</span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Monto Total",
      render: (presupuesto) => (
        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
           <BanknotesIcon className="h-4 w-4 text-green-600" />
           {formatCurrency(calculateTotal(presupuesto))}
        </div>
      ),
    },
  ];

  const rowActions = (presupuesto: PresupuestoRow): ActionDef[] => {
    const estaEliminado = !!presupuesto.deletedAt;

    return [
      {
        key: "view",
        label: <EyeIcon className="h-4 w-4" />,
        text: "Ver detalles",
        onClick: () => {
          void handleViewClick(presupuesto);
        },
        className:
          "flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors",
      },
      {
        key: "edit",
        label: <PencilSquareIcon className="h-4 w-4" />,
        text: "Editar presupuesto",
        onClick: () => handleEditClick(presupuesto),
        disabled: estaEliminado,
        className:
          "flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors",
      },
      {
        key: "delete-restore",
        label: estaEliminado ? <ArrowPathIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />,
        text: estaEliminado ? "Restaurar" : "Eliminar",
        onClick: () => handleDeleteClick(presupuesto),
        className: estaEliminado
          ? "flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors"
          : "flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors",
      },
    ];
  };

  return (
    <>
      <DataTable
        caption="Tabla de presupuestos registrados"
        data={presupuestos as PresupuestoRow[]}
        columns={columns}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          fetchPresupuestos(1, 10, term, showInactive);
        }}
        showInactive={showInactive}
        onToggleInactive={() => {
          const nextValue = !showInactive;
          setShowInactive(nextValue);
          fetchPresupuestos(1, 10, searchTerm, nextValue);
        }}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchPresupuestos(page, 10, searchTerm, showInactive)}
        actions={rowActions}
        getRowKey={(presupuesto) => presupuesto.id}
      />

      <div className="mt-4">
        <PresupuestoDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={() => {
            fetchPresupuestos(currentPage, 10, searchTerm, showInactive);
          }}
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
            ? `¿Estás seguro de que deseas restaurar el presupuesto PR-${String(selectedPresupuesto.id).padStart(4, '0')}?`
            : `¿Estás seguro de que deseas eliminar el presupuesto PR-${String(selectedPresupuesto?.id).padStart(4, '0')}?`
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
