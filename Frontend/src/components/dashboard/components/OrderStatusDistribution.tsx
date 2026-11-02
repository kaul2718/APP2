"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardChart } from "@/types/dashboard.types";
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";

interface OrderStatusDistributionProps {
  chart?: DashboardChart;
}

const STATUS_GRADIENTS: Record<string, { bar: string; text: string; bg: string }> = {
  Recepción: {
    bar: "from-blue-500 to-indigo-600",
    text: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  Diagnóstico: {
    bar: "from-purple-500 to-violet-600",
    text: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  Aprobación: {
    bar: "from-sky-500 to-cyan-600",
    text: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  Repuestos: {
    bar: "from-amber-500 to-yellow-600",
    text: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  Reparación: {
    bar: "from-orange-500 to-rose-600",
    text: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  Control: {
    bar: "from-emerald-500 to-teal-600",
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  Entrega: {
    bar: "from-teal-500 to-emerald-600",
    text: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  Archivados: {
    bar: "from-gray-500 to-slate-600",
    text: "text-gray-500",
    bg: "bg-gray-500/10",
  },
};

export default function OrderStatusDistribution({ chart }: OrderStatusDistributionProps) {
  const categories = chart?.categories || [];
  const seriesData = chart?.series?.[0]?.data || [];

  // CORRECCIÓN MATEMÁTICA RIGUROSA:
  // Calcular el total real sumando todos los valores, NO tomando el Math.max
  const totalOrders = useMemo(() => {
    if (chart?.total && chart.total > 0) return chart.total;
    return seriesData.reduce((acc, curr) => acc + (curr || 0), 0);
  }, [chart, seriesData]);

  const items = useMemo(() => {
    return categories.map((cat, idx) => {
      const value = seriesData[idx] || 0;
      const percentage = totalOrders > 0 ? Math.round((value / totalOrders) * 100) : 0;
      const theme = STATUS_GRADIENTS[cat] || {
        bar: "from-brand-500 to-brand-700",
        text: "text-brand-500",
        bg: "bg-brand-500/10",
      };
      return {
        category: cat,
        value,
        percentage,
        theme,
      };
    });
  }, [categories, seriesData, totalOrders]);

  return (
    <div className="bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <ChartBarSquareIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Distribución por Estado
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {totalOrders} órdenes en el período ({items.length} etapas activas)
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            Total: {totalOrders}
          </span>
        </div>

        {items.length > 0 && totalOrders > 0 ? (
          <div className="space-y-4 mt-6">
            {items.map((item, index) => (
              <div key={item.category} className="group">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-500 transition-colors">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {item.percentage}%
                    </span>
                    <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                      {item.value}
                    </span>
                  </div>
                </div>

                {/* Real Percentage Bar */}
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(3, item.percentage)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.08 }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.theme.bar}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ChartBarSquareIcon className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No hay órdenes registradas en este intervalo de fechas.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>* Porcentajes calculados matemáticamente sobre el total de órdenes del período.</span>
      </div>
    </div>
  );
}
