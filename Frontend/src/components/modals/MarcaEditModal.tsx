"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

interface Marca {
  id: number;
  nombre: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  marca: Marca | null;
  onSave: (updatedMarca: Marca) => void;
}

export default function MarcaEditModal({ isOpen, onClose, marca, onSave }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken || null;
  const [editando, setEditando] = React.useState<Marca | null>(marca);
  const [cargando, setCargando] = React.useState(false);
  const [estadoModificado, setEstadoModificado] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setEditando(marca);
    setEstadoModificado(null);
  }, [marca]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditando(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleEstadoChange = (nuevoEstado: boolean) => {
    setEstadoModificado(nuevoEstado);
    setEditando(prev => prev ? { ...prev, estado: nuevoEstado } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando || !token) return;

    setCargando(true);
    try {
      const cambios: Partial<Marca> = {};

      if (editando.nombre !== marca?.nombre) cambios.nombre = editando.nombre;
      if (estadoModificado !== null && estadoModificado !== marca?.estado)
        cambios.estado = estadoModificado;

      if (Object.keys(cambios).length > 0) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/marcas/${editando.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cambios),
        });

        if (!response.ok) throw new Error(`Error al actualizar: ${response.status}`);

        const data = await response.json();
        onSave(data);
        toast.success("Cambios guardados correctamente");
        onClose();
      } else {
        toast.info("No se realizaron cambios");
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
      setEditando(marca);
    } finally {
      setCargando(false);
      setEstadoModificado(null);
    }
  };

  if (!editando) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Marca">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Editar información de la marca
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Puedes modificar los datos de la marca. Los cambios se guardarán al presionar "Guardar cambios".
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
                <Input
                  value={new Date(editando.createdAt).toLocaleString()}
                  disabled
                />
              </div>
              <div>
                <Label>Última actualización</Label>
                <Input
                  value={new Date(editando.updatedAt).toLocaleString()}
                  disabled
                />
              </div>
              <div className="lg:col-span-2">
                <Label className="mb-1 block">Estado</Label>
                <select
                  value={editando.estado ? "activo" : "inactivo"}
                  disabled={cargando}
                  onChange={(e) => handleEstadoChange(e.target.value === "activo")}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {estadoModificado !== null && estadoModificado !== marca?.estado && (
                  <p className="mt-2 text-sm text-yellow-600">
                    ⚠️ El estado se actualizará a: {estadoModificado ? "Activo" : "Inactivo"}
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
