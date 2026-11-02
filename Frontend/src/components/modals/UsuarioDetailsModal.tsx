import React, { useState } from "react";
import CrudModal from "@/components/modals/CrudModal";
import Badge from "@/components/ui/badge/Badge";
import GenerarActivacionModal from "@/components/modals/GenerarActivacionModal";
import { Usuario } from "@/hooks/useUsuario";
import { Role } from "@/types/role";
import {
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  TrashIcon,
  DocumentIcon,
  QrCodeIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}


const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-5 h-5 mr-2 text-gray-500 dark:text-gray-400">
    {children}
  </span>
);

const InputDisplay = ({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value?: string | number | boolean | null;
}) => {
  const inputId = React.useId();
  return (
    <div>
      <label htmlFor={inputId} className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
        {icon}
        {label}
      </label>
      <input
        type="text"
        id={inputId}
        readOnly
        value={
          value !== undefined && value !== null ? value.toString() : "No disponible"
        }
        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        tabIndex={-1}
      />
    </div>
  );
};

export default function UsuarioDetailsModal({ isOpen, onClose, usuario }: Props) {
  const [isActivacionModalOpen, setIsActivacionModalOpen] = useState(false);
  const [modoActivacion, setModoActivacion] = useState<"ACTIVACION" | "RECUPERACION_PRESENCIAL">("ACTIVACION");

  if (!usuario) return null;

  const formatRoleName = (role: Role): string => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const estaActivo = usuario.estado;
  const fechaCreacion = new Date(usuario.createdAt).toLocaleDateString();
  const fechaActualizacion = new Date(usuario.updatedAt).toLocaleDateString();
  const fechaEliminacion = usuario.deletedAt 
    ? new Date(usuario.deletedAt).toLocaleDateString() 
    : "No eliminado";

  return (
    <>
      <CrudModal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalles del Usuario"
        onSubmit={async () => {}}
        mode="view"
        hideActions
      >
        <div className="px-6 py-4 space-y-6 text-sm">
          {/* Avatar & Encabezado */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
              {usuario.fotoPerfilUrl ? (
                <img
                  src={usuario.fotoPerfilUrl}
                  alt={usuario.nombre}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="font-bold text-lg text-brand-600 dark:text-brand-400">
                  {`${usuario.nombre.charAt(0)}${usuario.apellido ? usuario.apellido.charAt(0) : ''}`.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {usuario.nombre} {usuario.apellido}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{usuario.correo || 'Sin correo registrado'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                {usuario.role}
              </span>
            </div>
          </div>

          {/* Sección de Acceso al Portal para Clientes */}
          {usuario.role === 'client' && (
            <section className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <QrCodeIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <span>Acceso al Portal de Clientes</span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {(usuario as any).cuentaActivada
                      ? "El cliente tiene una cuenta activa. Para cambiar su contraseña, genere un restablecimiento presencial."
                      : "El cliente no tiene contraseña registrada. Puede activar su cuenta presencialmente si lo solicita."}
                  </p>
                </div>
                <Badge size="sm" variant="light" color={(usuario as any).cuentaActivada ? "success" : "warning"}>
                  {(usuario as any).cuentaActivada ? "Cuenta Activada" : "Sin Activar"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {!(usuario as any).cuentaActivada ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModoActivacion("ACTIVACION");
                      setIsActivacionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    <span>Generar acceso de activación (QR)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setModoActivacion("RECUPERACION_PRESENCIAL");
                      setIsActivacionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <KeyIcon className="w-4 h-4" />
                    <span>Restablecer contraseña presencial (QR)</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Sección básica */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InputDisplay
                label="ID"
                value={usuario.id}
                icon={<Icon><DocumentIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Nombre Completo"
                value={`${usuario.nombre} ${usuario.apellido}`}
                icon={<Icon><UserIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Cédula"
                value={usuario.cedula}
                icon={<Icon><IdentificationIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Correo Electrónico"
                value={usuario.correo || 'No registrado (Opcional)'}
                icon={<Icon><EnvelopeIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Teléfono"
                value={usuario.telefono}
                icon={<Icon><PhoneIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Rol"
                value={formatRoleName(usuario.role)}
                icon={<Icon><ShieldCheckIcon className="w-full h-full" /></Icon>}
              />
            </div>
          </section>

          {/* Información de ubicación */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Ubicación
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InputDisplay
                label="Dirección"
                value={usuario.direccion}
                icon={<Icon><MapPinIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Ciudad"
                value={usuario.ciudad}
                icon={<Icon><BuildingOfficeIcon className="w-full h-full" /></Icon>}
              />
            </div>
          </section>

          {/* Estado */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Estado
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InputDisplay
                label="Estado"
                value={estaActivo ? "Activo" : "Inactivo"}
                icon={<Icon><CheckCircleIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Fecha de Creación"
                value={fechaCreacion}
                icon={<Icon><CalendarDaysIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Última Actualización"
                value={fechaActualizacion}
                icon={<Icon><ClockIcon className="w-full h-full" /></Icon>}
              />
              <InputDisplay
                label="Fecha de Eliminación"
                value={fechaEliminacion}
                icon={<Icon><TrashIcon className="w-full h-full" /></Icon>}
              />
            </div>
          </section>

          {/* Cerrar */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="w-full max-w-xs rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </CrudModal>

      {/* Modal para generar QR de activación o restablecimiento presencial */}
      <GenerarActivacionModal
        isOpen={isActivacionModalOpen}
        onClose={() => setIsActivacionModalOpen(false)}
        usuario={usuario}
        modo={modoActivacion}
      />
    </>
  );
}