"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/button/Button";
import { useDashboard } from "@/hooks/useDashboard";
import {
  ExclamationCircleIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import DashboardKpiGrid from "./components/DashboardKpiGrid";
import OrdersEvolutionChart from "./components/OrdersEvolutionChart";
import OrderStatusDistribution from "./components/OrderStatusDistribution";
import PriorityAttentionPanel from "./components/PriorityAttentionPanel";
import RecentActivityTimeline from "./components/RecentActivityTimeline";
import WorkshopPerformanceSection from "./components/WorkshopPerformanceSection";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "all", label: "TODOS" },
];

const ROLE_TITLES: Record<string, string> = {
  admin: "Panel Administrativo",
  tech: "Panel Técnico",
  recep: "Panel de Recepción",
  client: "Mi Panel de Control",
};

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export default function RoleDashboard() {
  const router = useRouter();
  const { data, loading, error, range, setRange, refetch } = useDashboard("30d");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-6" />
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
            />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 animate-pulse rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800" />
          <div className="lg:col-span-5 h-80 animate-pulse rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          Dashboard
        </h1>
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center dark:border-rose-900/30 dark:bg-rose-900/10">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-400">
            Error de Conexión
          </h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
            {error || "No se pudieron cargar los datos del taller."}
          </p>
          <Button onClick={() => void refetch()} className="mt-6" variant="primary">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const roleTitle = ROLE_TITLES[data.role] || "Dashboard";
  // Encontrar gráficas correspondientes
  const evolutionChart = data.charts.find((c) => c.key === "orders-evolution") || data.charts[0];
  const statusChart = data.charts.find((c) => c.key === "orders-status") || data.charts[1] || data.charts[0];

  const isAdmin = data.role === "admin";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8 w-full"
    >
      {/* Header con Título, Badge de Propuesta y Filtros de Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-gray-800/60">
        <div>
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {roleTitle}
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
            <ClockIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>Última sincronización: {formatDate(data.generatedAt)}</span>
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/90 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-xs">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => void setRange(option.value)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${range === option.value
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. SECCIÓN: SEIS TARJETAS KPI (WIRE FRAME NIVEL 1) */}
      <motion.section variants={itemVariants}>
        <DashboardKpiGrid kpis={data.kpis} />
      </motion.section>

      {/* 2. SECCIÓN: GRÁFICAS DE GESTIÓN (WIRE FRAME NIVEL 2) */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {isAdmin && evolutionChart ? (
          <>
            <div className="lg:col-span-7">
              <OrdersEvolutionChart chart={evolutionChart} />
            </div>
            <div className="lg:col-span-5">
              <OrderStatusDistribution chart={statusChart} />
            </div>
          </>
        ) : (
          <div className="lg:col-span-12">
            <OrderStatusDistribution chart={statusChart} />
          </div>
        )}
      </motion.section>

      {/* 3. SECCIÓN: PANEL DE ATENCIÓN INMEDIATA Y ACTIVIDAD (WIRE FRAME NIVEL 3) */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <PriorityAttentionPanel alerts={data.alerts} />
        </div>
        <div className="lg:col-span-6">
          <RecentActivityTimeline recent={data.recent} />
        </div>
      </motion.section>

      {/* 4. SECCIÓN: RENDIMIENTO TÉCNICO Y TALLER (WIRE FRAME NIVEL 4) */}
      {isAdmin && (
        <motion.section variants={itemVariants}>
          <WorkshopPerformanceSection
            turnaroundTimes={data.turnaroundTimes}
            technicianWorkloads={data.technicianWorkloads}
          />
        </motion.section>
      )}
    </motion.div>
  );
}
