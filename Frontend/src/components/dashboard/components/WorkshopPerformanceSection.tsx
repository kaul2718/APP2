"use client";

import React from "react";
import { TurnaroundTimeStat, TechnicianWorkloadStat } from "@/types/dashboard.types";
import {
  ClockIcon,
  UserGroupIcon,
  BoltIcon,
  FolderOpenIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface WorkshopPerformanceSectionProps {
  turnaroundTimes?: TurnaroundTimeStat[];
  technicianWorkloads?: TechnicianWorkloadStat[];
}

export default function WorkshopPerformanceSection({
  turnaroundTimes = [],
  technicianWorkloads = [],
}: WorkshopPerformanceSectionProps) {
  const expressStat = turnaroundTimes.find((t) => t.tipoOrden.toUpperCase() === "EXPRESS");
  const completaStat = turnaroundTimes.find((t) => t.tipoOrden.toUpperCase() === "COMPLETA");

  const maxTechLoad = Math.max(
    ...technicianWorkloads.map((t) => t.asignadasActivas),
    1
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Tiempos Promedio de Atención (Express vs Completa) */}
      <div className="lg:col-span-5 bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20">
              <ClockIcon className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Tiempos Promedio de Atención
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Diferenciado entre órdenes Express y Completas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Express Card */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BoltIcon className="w-3.5 h-3.5" />
                  Express
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {expressStat?.muestra || 0} entregadas
                </span>
              </div>

              {expressStat && expressStat.muestra > 0 ? (
                <div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {expressStat.diasPromedio}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      días promedio
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    ~{expressStat.horasPromedio} horas desde recepción a entrega.
                  </p>
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Sin registros suficientes en este período.
                </div>
              )}
            </div>

            {/* Completa Card */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpenIcon className="w-3.5 h-3.5" />
                  Completa
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {completaStat?.muestra || 0} entregadas
                </span>
              </div>

              {completaStat && completaStat.muestra > 0 ? (
                <div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {completaStat.diasPromedio}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      días promedio
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    ~{completaStat.horasPromedio} horas desde recepción a entrega.
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                    En curso en taller
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Actualmente en etapa de diagnóstico y repuestos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-[11px] text-gray-500 dark:text-gray-400">
          * Basado en las transiciones históricas registradas en cada orden.
        </div>
      </div>

      {/* 2. Carga de Trabajo por Técnico */}
      <div className="lg:col-span-7 bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <UserGroupIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Carga de Trabajo por Técnico
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Órdenes activas en taller y completadas en el período
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {technicianWorkloads.length} técnicos
            </span>
          </div>

          {technicianWorkloads.length > 0 ? (
            <div className="space-y-3.5 mt-4">
              {technicianWorkloads.slice(0, 5).map((tech) => {
                const loadPercent = Math.round((tech.asignadasActivas / maxTechLoad) * 100);

                return (
                  <div key={tech.id} className="group">
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                        {tech.nombre}
                      </span>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                          <strong className="text-gray-900 dark:text-white font-black">
                            {tech.asignadasActivas}
                          </strong>{" "}
                          activas
                        </span>
                        {tech.completadasPeriodo > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-0.5 text-[11px]">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            {tech.completadasPeriodo} listas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, loadPercent)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          tech.asignadasActivas >= 5
                            ? "bg-gradient-to-r from-amber-500 to-rose-500"
                            : "bg-gradient-to-r from-brand-500 to-emerald-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-gray-500 dark:text-gray-400">
              No se registran técnicos activos en el sistema.
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-[11px] text-gray-500 dark:text-gray-400">
          * Carga balanceada recomendada: hasta 5 equipos activos por técnico simultáneamente.
        </div>
      </div>
    </div>
  );
}
