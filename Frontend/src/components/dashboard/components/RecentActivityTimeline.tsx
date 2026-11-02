"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardRecentItem } from "@/types/dashboard.types";
import { ClockIcon, ArrowRightIcon, UserIcon } from "@heroicons/react/24/outline";

interface RecentActivityTimelineProps {
  recent: DashboardRecentItem[];
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  return date.toLocaleString("es-EC", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Entrega":
      return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
    case "Control":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "Reparación":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    case "Repuestos":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Diagnóstico":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "Aprobación":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
    case "Recepción":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
  }
}

export default function RecentActivityTimeline({ recent }: RecentActivityTimelineProps) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <ClockIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Últimos ingresos y cambios de estado en el taller
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/ver-orden")}
            className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 transition-colors"
          >
            <span>Ver todo</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent && recent.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/80 mt-2">
            {recent.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(item.path || "/ver-orden")}
                className="py-3 flex items-center justify-between gap-3 group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 px-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] font-black text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shrink-0">
                    #{item.title.split("#")[1] || item.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                      {item.subtitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {item.tecnico || "Taller HDC"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-gray-500 dark:text-gray-400">
            No hay actividad reciente para mostrar.
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>* Registros sincronizados en tiempo real con el flujo de trabajo.</span>
      </div>
    </div>
  );
}
