"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardAlert } from "@/types/dashboard.types";
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  DocumentTextIcon,
  CubeIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

interface PriorityAttentionPanelProps {
  alerts: DashboardAlert[];
}

export default function PriorityAttentionPanel({ alerts }: PriorityAttentionPanelProps) {
  const router = useRouter();

  const getAlertIcon = (alert: DashboardAlert) => {
    switch (alert.id) {
      case "delayed-orders":
        return <ClockIcon className="w-5 h-5 text-rose-500" />;
      case "pending-budgets":
        return <DocumentTextIcon className="w-5 h-5 text-amber-500" />;
      case "ready-pickup":
        return <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />;
      case "low-stock":
        return <CubeIcon className="w-5 h-5 text-amber-500" />;
      case "unassigned-orders":
        return <UserPlusIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertTheme = (severity: string) => {
    switch (severity) {
      case "error":
        return {
          border: "border-rose-500/30 hover:border-rose-500/60",
          bg: "bg-rose-500/5 hover:bg-rose-500/10",
          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
          btn: "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300",
        };
      case "warning":
        return {
          border: "border-amber-500/30 hover:border-amber-500/60",
          bg: "bg-amber-500/5 hover:bg-amber-500/10",
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          btn: "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300",
        };
      case "success":
        return {
          border: "border-emerald-500/30 hover:border-emerald-500/60",
          bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          btn: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
        };
      default:
        return {
          border: "border-blue-500/30 hover:border-blue-500/60",
          bg: "bg-blue-500/5 hover:bg-blue-500/10",
          badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          btn: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Órdenes que Requieren Atención
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Acciones prioritarias y cuellos de botella del taller
              </p>
            </div>
          </div>
          {alerts.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {alerts.length} prioritarias
            </span>
          )}
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3 mt-4">
            {alerts.map((alert) => {
              const theme = getAlertTheme(alert.severity);

              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (alert.actionUrl) {
                      router.push(alert.actionUrl);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${theme.bg} ${theme.border}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shrink-0 shadow-2xs">
                      {getAlertIcon(alert)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {alert.title || "Atención requerida"}
                        </h4>
                        {alert.count !== undefined && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${theme.badge}`}>
                            {alert.count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 text-xs font-bold shrink-0 transition-transform group-hover:translate-x-0.5 ${theme.btn}`}
                  >
                    <span>{alert.actionLabel || "Resolver"}</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500 mb-3">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Taller al día
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              No hay órdenes retrasadas, presupuestos vencidos ni alertas de stock pendientes.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>* Haz clic en cualquier alerta para navegar a la lista filtrada.</span>
      </div>
    </div>
  );
}
