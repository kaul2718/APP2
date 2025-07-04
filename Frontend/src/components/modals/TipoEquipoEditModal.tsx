'use client';

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

interface TipoEquipo {
  id: number;
  nombre: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipoEquipo: TipoEquipo | null;
  onSave: (updatedTipoEquipo: TipoEquipo) => void;
}

export default function TipoEquipoEditModal({ isOpen, onClose, tipoEquipo, onSave }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken || null;
  const [editando, setEditando] = React.useState<TipoEquipo | null>(tipoEquipo);
  const [cargando, setCargando] = React.useState(false);
  const [pendingEstado, setPendingEstado] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setEditando(tipoEquipo);
    setPendingEstado(null);
  }, [tipoEquipo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditando((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando || !token) return;

    setCargando(true);
    try {
      // Actualizar nombre si cambió
      if (editando.nombre !== tipoEquipo?.nombre) {
        const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/${editando.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre: editando.nombre }),
        });

        if (!updateResponse.ok) {
          throw new Error(`Error al actualizar: ${updateResponse.status}`);
        }
      }

      // Actualizar estado si hay cambio pendiente
      if (pendingEstado !== null && pendingEstado !== tipoEquipo?.estado) {
        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/${editando.id}/toggle-estado`;

        const estadoResponse = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: pendingEstado }),
        });

        if (!estadoResponse.ok) {
          throw new Error(`Error al actualizar estado: ${estadoResponse.status}`);
        }
      }

      // Refrescar datos actualizados
      let data = editando;
      try {
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/${editando.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (refreshResponse.ok) {
          data = await refreshResponse.json();
        }
      } catch {
        // Ignorar errores en refresh
      }

      onSave(data);
      toast.success("Cambios guardados correctamente");
      setPendingEstado(null);
      onClose();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
      setEditando(tipoEquipo);
    } finally {
      setCargando(false);
    }
  };

  if (!editando) return null;

  const estaActivo = pendingEstado !== null ? pendingEstado : editando.estado;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Tipo de Equipo">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Editar información del tipo de equipo
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Puedes modificar los datos del tipo de equipo. Los cambios se guardarán al presionar "Guardar cambios".
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="custom-scrollbar h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>ID</Label>
                <Input name="id" value={editando.id} disabled />
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input
                  name="nombre"
                  value={editando.nombre}
                  onChange={handleInputChange}
                  required
                  disabled={cargando}
                />
              </div>
              <div>
                <Label>Fecha de creación</Label>
                <Input value={new Date(editando.createdAt).toLocaleString()} disabled />
              </div>
              <div>
                <Label>Última actualización</Label>
                <Input value={new Date(editando.updatedAt).toLocaleString()} disabled />
              </div>
              <div className="lg:col-span-2">
                <Label className="mb-1 block">Estado</Label>
                <select
                  value={estaActivo ? "activo" : "inactivo"}
                  disabled={cargando}
                  onChange={(e) => {
                    const nuevoEstado = e.target.value === "activo";
                    setPendingEstado(nuevoEstado);
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {pendingEstado !== null && pendingEstado !== editando.estado && (
                  <p className="mt-2 text-sm text-yellow-600">
                    {pendingEstado
                      ? "⚠️ El tipo de equipo se habilitará al guardar"
                      : "⚠️ El tipo de equipo se deshabilitará al guardar"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando} loading={cargando}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
