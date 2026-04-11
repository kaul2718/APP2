'use client';

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import useEditarUsuario from "@/hooks/useEditarUsuario";
import { Cliente } from "@/hooks/useClientes";
import Badge from "@/components/ui/badge/Badge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onSave: (updatedCliente: Cliente) => void;
}

export default function ClientEditModal({ isOpen, onClose, cliente, onSave }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken || null;

  const {
    editando,
    handleInputChange,
    actualizarUsuario,
    cargando,
    resetearEdicion,
  } = useEditarUsuario(cliente, token);

  const handleCancel = () => {
    resetearEdicion();
    onClose();
  };

  const handleSubmit = async () => {
    const actualizado = await actualizarUsuario();
    if (actualizado) {
      onSave(actualizado);
      onClose();
    }
  };

  if (!editando) return null;

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Editar Cliente"
      onSubmit={handleSubmit}
      loading={cargando}
      mode="edit"
    >
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Editar información del cliente
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Puedes modificar los datos del cliente. Los campos obligatorios están marcados con *.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="flex flex-col"
        >
          <div className="custom-scrollbar h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Cédula</Label>
                <Input name="cedula" value={editando.cedula} onChange={handleInputChange} disabled />
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input name="nombre" value={editando.nombre} onChange={handleInputChange} required disabled={cargando} />
              </div>
              <div>
                <Label>Correo *</Label>
                <Input type="email" name="correo" value={editando.correo} onChange={handleInputChange} required disabled={cargando} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input name="telefono" value={editando.telefono ?? ""} onChange={handleInputChange} disabled={cargando} />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input name="ciudad" value={editando.ciudad ?? ""} onChange={handleInputChange} disabled={cargando} />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input name="direccion" value={editando.direccion ?? ""} onChange={handleInputChange} disabled={cargando} />
              </div>
              <div>
                <Label>Rol</Label>
                <select
                  name="role"
                  value={editando.role}
                  onChange={handleInputChange}
                  disabled={cargando}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                  <option value="Cliente">Cliente</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Recepcionista">Recepcionista</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Estado</Label>
                <div className="flex items-center gap-3">
                  <Badge size="sm" color={editando.estado ? "success" : "error"}>
                    {editando.estado ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {editando.estado ? "El usuario está activo" : "El usuario está inactivo"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Para cambiar el estado, usa el botón en la tabla principal.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </CrudModal>
  );
}
