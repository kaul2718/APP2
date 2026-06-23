"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificacion, Notificacion } from "@/hooks/useNotificacion";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

// Helper para formatear tiempo transcurrido de forma amigable en español
function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    
    if (isNaN(diffMs)) return "Hace unos momentos";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace unos momentos";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? "s" : ""}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    
    return past.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  } catch (error) {
    return "Recientemente";
  }
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notificaciones,
    unreadCount,
    marcarLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    loading
  } = useNotificacion();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Manejar click en una notificación
  const handleNotificationClick = async (notif: Notificacion) => {
    // Marcar como leída
    if (!notif.leido) {
      await marcarLeida(notif.id);
    }
    
    closeDropdown();

    const tipoNombre = notif.tipo?.nombre?.toLowerCase() || "";

    // Si es de inventario, redirigir a almacén filtrando por el nombre del repuesto
    if (tipoNombre.includes("inventario") || tipoNombre.includes("stock") || tipoNombre.includes("almacen")) {
      const match = notif.mensaje.match(/"([^"]+)"/);
      const itemName = match ? match[1] : "";
      
      if (itemName) {
        router.push(`/items?search=${encodeURIComponent(itemName)}`);
      } else {
        router.push("/items");
      }
    } else {
      // Redireccionar si tiene una orden asociada
      if (notif.ordenServicioId) {
        router.push(`/ver-orden/${notif.ordenServicioId}`);
      } else {
        router.push("/ver-orden");
      }
    }
  };

  // Renderizar ícono e indicador de color según tipo de notificación
  const renderTypeStyles = (tipoNombre?: string) => {
    const nombre = tipoNombre?.toLowerCase() || "";
    
    if (nombre.includes("asign") || nombre.includes("tecnic")) {
      // Tipo Asignación / Técnico -> Amarillo/Gold/Bronce
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-100 dark:border-amber-900/30",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      };
    } else if (nombre.includes("presupuesto")) {
      // Tipo Presupuesto -> Verde Esmeralda (Dinero/Aprobación)
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-100 dark:border-emerald-900/30",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    } else if (nombre.includes("inventario") || nombre.includes("stock") || nombre.includes("almacen")) {
      // Tipo Inventario -> Rojo/Naranja
      return {
        bg: "bg-rose-50 dark:bg-rose-950/30",
        text: "text-rose-600 dark:text-rose-400",
        border: "border-rose-100 dark:border-rose-900/30",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      };
    } else {
      // Tipo Orden / General -> Azul Corporativo
      return {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-100 dark:border-blue-900/30",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16.01h.01" />
          </svg>
        ),
      };
    }
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-all duration-300 bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white hover:scale-105 active:scale-95"
        onClick={toggleDropdown}
        aria-label="Abrir notificaciones"
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-error-600 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unreadCount}
            <span className="absolute inline-flex w-full h-full bg-error-400 rounded-full opacity-40 animate-ping z-[-1]"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[500px] w-[360px] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-dark sm:w-[380px] lg:right-0 overflow-hidden"
      >
        {/* Cabecera del dropdown */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h5 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Notificaciones
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tienes {unreadCount} sin leer
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="text-xs text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Marcar todas como leídas"
              >
                Leer todas
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Cerrar notificaciones"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 dark:text-gray-400 p-6">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Cargando notificaciones...</span>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900/60 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Todo al día</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
                No tienes ninguna notificación pendiente.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {notificaciones.map((notif) => {
                const styles = renderTypeStyles(notif.tipo?.nombre);
                return (
                  <li key={notif.id} className="relative group transition-all">
                    <div
                      className={`flex gap-3.5 p-4 items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 ${
                        !notif.leido ? "bg-blue-50/20 dark:bg-brand-500/5 font-medium" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {/* Icono de Tipo */}
                      <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${styles.bg} ${styles.text} ${styles.border} shadow-sm`}>
                        {styles.icon}
                      </span>

                      {/* Cuerpo de la Notificación */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                            {notif.tipo?.nombre || "General"}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(notif.fechaEnvio)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words pr-4">
                          {notif.mensaje}
                        </p>
                      </div>

                      {/* Botón para marcar como leída o eliminar */}
                      {!notif.leido && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      )}
                    </div>

                    {/* Botón eliminar al pasar el cursor */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarNotificacion(notif.id);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                      title="Eliminar notificación"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie del dropdown */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-center">
          <button
            onClick={() => {
              router.push("/ver-orden");
              closeDropdown();
            }}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 py-1 px-3"
          >
            Ver todas las órdenes
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
