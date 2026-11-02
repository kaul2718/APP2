"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardKpi } from "@/types/dashboard.types";
import {
  WrenchScrewdriverIcon,
  InboxArrowDownIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface DashboardKpiGridProps {
  kpis: DashboardKpi[];
}

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

export default function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  const router = useRouter();

  const getKpiMeta = (kpi: DashboardKpi) => {
    switch (kpi.key) {
      case "in-workshop":
        return {
          icon: <WrenchScrewdriverIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
          bgIcon: "bg-blue-500/10 border-blue-500/20",
          glow: "from-blue-500/5 to-transparent",
          textColor: "text-blue-500",
        };
      case "orders-created":
        return {
          icon: <InboxArrowDownIcon className="w-6 h-6 text-brand-500 dark:text-brand-400" />,
          bgIcon: "bg-brand-500/10 border-brand-500/20",
          glow: "from-brand-500/5 to-transparent",
          textColor: "text-brand-500",
        };
      case "orders-delivered":
        return {
          icon: <CheckBadgeIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
          bgIcon: "bg-emerald-500/10 border-emerald-500/20",
          glow: "from-emerald-500/5 to-transparent",
          textColor: "text-emerald-500",
        };
      case "pending-budgets":
        return {
          icon: <DocumentTextIcon className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
          bgIcon: "bg-amber-500/10 border-amber-500/20",
          glow: "from-amber-500/5 to-transparent",
          textColor: "text-amber-500",
        };
      case "delayed-orders":
        return {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-rose-500 dark:text-rose-400" />,
          bgIcon: "bg-rose-500/10 border-rose-500/20",
          glow: "from-rose-500/5 to-transparent",
          textColor: "text-rose-500",
        };
      case "ready-to-pickup":
        return {
          icon: <ClockIcon className="w-6 h-6 text-teal-500 dark:text-teal-400" />,
          bgIcon: "bg-teal-500/10 border-teal-500/20",
          glow: "from-teal-500/5 to-transparent",
          textColor: "text-teal-500",
        };
      default:
        return {
          icon: <WrenchScrewdriverIcon className="w-6 h-6 text-gray-500" />,
          bgIcon: "bg-gray-500/10 border-gray-500/20",
          glow: "from-gray-500/5 to-transparent",
          textColor: "text-gray-500",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {kpis.map((kpi) => {
        const meta = getKpiMeta(kpi);
        const isClickable = Boolean(kpi.actionUrl);

        return (
          <motion.div
            key={kpi.key}
            variants={itemVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            onClick={() => {
              if (kpi.actionUrl) {
                router.push(kpi.actionUrl);
              }
            }}
            className={`relative overflow-hidden group p-5 bg-white dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all ${
              isClickable ? "cursor-pointer hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md" : ""
            }`}
          >
            {/* Subtle Gradient Glow */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${meta.glow} rounded-full -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-125`}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-3 rounded-xl border ${meta.bgIcon} transition-transform group-hover:scale-105 duration-200`}
                >
                  {meta.icon}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {kpi.label}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {kpi.value.toLocaleString()}
                    </h3>
                    {kpi.variation !== undefined && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                          kpi.variation >= 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {kpi.variation >= 0 ? (
                          <ArrowTrendingUpIcon className="w-3 h-3" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-3 h-3" />
                        )}
                        {kpi.variation > 0 ? `+${kpi.variation}%` : `${kpi.variation}%`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isClickable && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {kpi.subtitle && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {kpi.subtitle}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
