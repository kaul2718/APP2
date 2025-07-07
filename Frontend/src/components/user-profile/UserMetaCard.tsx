"use client";

import React, { useState } from "react";
import { useModal } from "@/hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Spinner } from "../ui/spinner";
import { toast } from "react-toastify";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const {
    usuario: datosUsuario,
    cargando,
    error,
    editando: datosEditables,
    passwordData,
    setEditando: setDatosEditables,
    actualizarPerfil: guardarCambios,
    cambiarContrasena,
    handleInputChange: handleChangeCampo,
    handlePasswordChange: handleChangePassword,
    resetearEdicion,
  } = useUserProfile();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const handleOpenModal = () => {
    openModal();
    resetearEdicion();
    setActiveTab('profile');
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datosEditables) {
      toast.error("No hay datos para guardar");
      return;
    }

    // Validación nombre
    if (!datosEditables.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(datosEditables.nombre)) {
      toast.error("El nombre solo puede contener letras y espacios");
      return;
    }

    // Validación correo
    if (!datosEditables.correo.trim()) {
      toast.error("El correo es obligatorio");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosEditables.correo)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    // Validación teléfono
    if (datosEditables.telefono && !/^[0-9\s]+$/.test(datosEditables.telefono)) {
      toast.error("El teléfono solo debe contener números");
      return;
    }

    const success = await guardarCambios();
    if (success) {
      closeModal();
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.error("Debes ingresar tu contraseña actual");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Debes ingresar una nueva contraseña");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    const success = await cambiarContrasena();
    if (success) {
      closeModal();
    }
  };

  const handleCancel = () => {
    resetearEdicion();
    closeModal();
  };

  if (cargando && !datosUsuario) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 flex justify-center items-center h-40">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // if (error || !datosUsuario) {
  //   return (
  //     <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 text-center">
  //       <p className="text-red-500 dark:text-red-400 mb-2">
  //         Error al cargar los datos del usuario
  //       </p>
  //       {error && (
  //         <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
  //           {error}
  //         </p>
  //       )}
  //       <Button
  //         size="sm"
  //         onClick={() => window.location.reload()}
  //         variant="outline"
  //       >
  //         Intentar nuevamente
  //       </Button>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 flex items-center justify-center rounded-full border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-700">
              <svg
                className="w-10 h-10 text-gray-400 dark:text-gray-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {datosEditables?.nombre || datosUsuario.nombre}  {datosEditables?.apellido || datosUsuario.apellido}

              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {datosEditables?.ciudad || datosUsuario?.ciudad}

                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {datosEditables?.direccion || datosUsuario?.direccion}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {datosEditables?.role || datosUsuario?.role}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            disabled={cargando}
            className={`flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto ${cargando ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {cargando ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill=""
                  />
                </svg>
                Editar
              </>
            )}
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {activeTab === 'profile' ? 'Editar información personal' : 'Cambiar contraseña'}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {activeTab === 'profile' ? 'Actualiza tus datos personales' : 'Ingresa tu contraseña actual y la nueva contraseña'}
            </p>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('profile')}
            >
              Perfil
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'password' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('password')}
            >
              Contraseña
            </button>
          </div>

          {activeTab === 'profile' ? (
            <form onSubmit={handleSubmitProfile} className="flex flex-col">
              <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                <div className="mt-7">
                  <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                    Información del usuario
                  </h5>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Cédula</Label>
                      <Input
                        type="text"
                        name="cedula"
                        value={datosEditables?.cedula || ""}
                        onChange={handleChangeCampo}
                        disabled
                      />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Nombre *</Label>
                      <Input
                        type="text"
                        name="nombre"
                        value={datosEditables?.nombre || ""}
                        onChange={handleChangeCampo}
                        required
                        disabled={cargando}
                      />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Apellido *</Label>
                      <Input
                        type="text"
                        name="apellido"
                        value={datosEditables?.apellido || ""}
                        onChange={handleChangeCampo}
                        required
                        disabled={cargando}
                      />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Correo electrónico *</Label>
                      <Input
                        type="email"
                        name="correo"
                        value={datosEditables?.correo || ""}
                        onChange={handleChangeCampo}
                        required
                        disabled={cargando}
                      />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Teléfono</Label>
                      <Input
                        type="text"
                        name="telefono"
                        value={datosEditables?.telefono || ""}
                        onChange={handleChangeCampo}
                        disabled={cargando}
                      />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Ciudad</Label>
                      <Input
                        type="text"
                        name="ciudad"
                        value={datosEditables?.ciudad || ""}
                        onChange={handleChangeCampo}
                        disabled={cargando}
                      />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Dirección</Label>
                      <Input
                        type="text"
                        name="direccion"
                        value={datosEditables?.direccion || ""}
                        onChange={handleChangeCampo}
                        disabled={cargando}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  type="button"
                  disabled={cargando}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={cargando}
                  loading={cargando}
                >
                  {cargando ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitPassword} className="flex flex-col">
              <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                <div className="mt-7">
                  <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                    Cambiar contraseña
                  </h5>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                    <div className="col-span-1">
                      <Label>Contraseña actual *</Label>
                      <Input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handleChangePassword}
                        required
                        disabled={cargando}
                      />
                    </div>

                    <div className="col-span-1">
                      <Label>Nueva contraseña *</Label>
                      <Input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handleChangePassword}
                        required
                        disabled={cargando}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        La contraseña debe tener al menos 6 caracteres
                      </p>
                    </div>

                    <div className="col-span-1">
                      <Label>Confirmar nueva contraseña *</Label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handleChangePassword}
                        required
                        disabled={cargando}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  type="button"
                  disabled={cargando}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={cargando}
                  loading={cargando}
                >
                  {cargando ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}