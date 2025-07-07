"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Order } from "@/interfaces/order";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-5 h-5 mr-2 text-gray-400 dark:text-gray-500">
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
}) => (
  <div>
    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon}
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={
        value !== undefined && value !== null ? value.toString() : "No disponible"
      }
      className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      tabIndex={-1}
    />
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
    {title}
  </h3>
);

const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
    {children}
  </div>
);

export default function OrdenDetailsModal({ isOpen, onClose, order }: Props) {
  if (!order) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificada";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "No especificado";
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles de Orden #${order.workOrderNumber}`}
      className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="px-6 py-4 space-y-6 text-sm">
        {/* Sección 1: Información Principal */}
        <CardContainer>
          <SectionHeader title="Información Principal" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Número de Orden"
              value={order.workOrderNumber}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Estado de la Orden"
              value={order.estadoOrden?.nombre || "Sin estado"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Fecha Prometida"
              value={formatDate(order.fechaPrometidaEntrega)}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Estado"
              value={order.estado ? "Activo" : "Inactivo"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={order.estado ? "M9 12l2 2 4-4" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                </Icon>
              }
            />
          </div>
        </CardContainer>

        {/* Sección 2: Información de Personas */}
        <CardContainer>
          <SectionHeader title="Información de Personas" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <InputDisplay
              label="Cliente"
              value={`${order.client.nombre} ${order.client.apellido || ''}`.trim()}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Técnico Asignado"
              value={order.technician ? `${order.technician.nombre} ${order.technician.apellido || ''}`.trim() : "No asignado"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Recepcionista"
              value={order.recepcionista ? `${order.recepcionista.nombre} ${order.recepcionista.apellido || ''}`.trim() : "No especificado"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Icon>
              }
            />
          </div>
        </CardContainer>

        {/* Sección 3: Información del Equipo */}
        <CardContainer>
          <SectionHeader title="Información del Equipo" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Número de Serie"
              value={order.equipo.numeroSerie}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Tipo de Equipo"
              value={order.equipo.tipoEquipo?.nombre || "No especificado"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Marca"
              value={order.equipo.marca?.nombre || "No especificada"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Modelo"
              value={order.equipo.modelo?.nombre || "No especificado"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Icon>
              }
            />
          </div>
        </CardContainer>

        {/* Sección 4: Problema y Accesorios */}
        <CardContainer>
          <SectionHeader title="Problema Reportado" />
          <div className="grid grid-cols-1 gap-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
                Descripción del Problema
              </label>
              <textarea
                readOnly
                value={order.problemaReportado}
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 min-h-[100px]"
                tabIndex={-1}
              />
            </div>
            <InputDisplay
              label="Accesorios"
              value={order.accesorios?.join(", ") || "No especificados"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </Icon>
              }
            />
          </div>
        </CardContainer>

        {/* Sección 5: Presupuesto */}
        {order.presupuesto && (
          <CardContainer>
            <SectionHeader title="Presupuesto" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InputDisplay
                label="Estado del Presupuesto"
                value={order.presupuesto.estado.nombre}
                icon={
                  <Icon>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Icon>
                }
              />
              <InputDisplay
                label="Fecha de Emisión"
                value={formatDate(order.presupuesto.fechaEmision)}
                icon={
                  <Icon>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </Icon>
                }
              />
              {order.presupuesto.descripcion && (
                <div className="col-span-2">
                  <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
                    Descripción
                  </label>
                  <textarea
                    readOnly
                    value={order.presupuesto.descripcion}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 min-h-[80px]"
                    tabIndex={-1}
                  />
                </div>
              )}
            </div>

            {/* Detalle de Mano de Obra */}
            {order.presupuesto && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Mano de Obra</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  {order.actividades?.map((actividad, index) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <p className="font-medium">{actividad.tipoActividad.nombre}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{actividad.trabajoRealizado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle de Repuestos */}
            {order.detallesRepuestos && order.detallesRepuestos.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Repuestos</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Repuesto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio Unitario</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {order.detallesRepuestos.map((detalle, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{detalle.repuesto.nombre}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{detalle.repuesto.codigo}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{detalle.cantidad}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatCurrency(detalle.precioUnitario)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatCurrency(detalle.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContainer>
        )}

        {/* Sección 6: Actividades Técnicas */}
        {order.actividades && order.actividades.length > 0 && (
          <CardContainer>
            <SectionHeader title="Actividades Técnicas" />
            <div className="space-y-4">
              {order.actividades.map((actividad, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">{actividad.tipoActividad.nombre}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(actividad.fecha)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Diagnóstico:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{actividad.diagnostico}</p>
                  </div>
                  <div className="mt-2">
                    <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Trabajo Realizado:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{actividad.trabajoRealizado}</p>
                  </div>
                  
                  {/* Evidencias Técnicas */}
                  {order.evidencias && order.evidencias.filter(e => e.actividadId === actividad.id).length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Evidencias:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {order.evidencias
                          .filter(e => e.actividadId === actividad.id)
                          .map((evidencia, evIndex) => (
                            <div key={evIndex} className="border rounded overflow-hidden">
                              <img 
                                src={evidencia.urlImagen} 
                                alt={evidencia.descripcion || `Evidencia ${evIndex + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              {evidencia.descripcion && (
                                <p className="text-xs p-1 text-gray-600 dark:text-gray-400 truncate">
                                  {evidencia.descripcion}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContainer>
        )}

        {/* Sección 7: Historial de Estados */}
        {order.historialEstados && order.historialEstados.length > 0 && (
          <CardContainer>
            <SectionHeader title="Historial de Estados" />
            <div className="space-y-3">
              {order.historialEstados.map((historial, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {historial.estadoOrden.nombre} - {formatDate(historial.fechaCambio)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cambiado por: {historial.usuario.nombre} {historial.usuario.apellido}
                    </p>
                    {historial.observaciones && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {historial.observaciones}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContainer>
        )}

        {/* Sección 8: Fechas y Metadatos */}
        <CardContainer>
          <SectionHeader title="Metadatos" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Fecha de Creación"
              value={formatDate(order.createdAt)}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Última Actualización"
              value={formatDate(order.updatedAt)}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Icon>
              }
            />
            {order.deletedAt && (
              <InputDisplay
                label="Fecha de Eliminación"
                value={formatDate(order.deletedAt)}
                icon={
                  <Icon>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Icon>
                }
              />
            )}
          </div>
        </CardContainer>

        {/* Botón de Cierre */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="w-full max-w-xs rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}