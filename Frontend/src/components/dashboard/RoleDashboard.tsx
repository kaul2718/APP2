"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge, { type BadgeColor } from "@/components/ui/badge/Badge";
import { useDashboard } from "@/hooks/useDashboard";
import { 
  ClipboardDocumentCheckIcon, 
  ArrowPathIcon, 
  ExclamationCircleIcon, 
  BellIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

const ROLE_TITLES: Record<string, string> = {
  admin: "Panel Administrativo",
  tech: "Panel Técnico",
  recep: "Panel de Recepción",
  client: "Mi Panel de Control",
};

const QUICK_ACTIONS: Record<string, Array<{ label: string; path: string; icon: React.ReactNode }>> = {
  admin: [
    { label: "Gestionar Órdenes", path: "/ver-orden", icon: <ClipboardDocumentCheckIcon className="w-4 h-4" /> },
    { label: "Presupuestos", path: "/ver-presupuesto", icon: <ChartBarIcon className="w-4 h-4" /> },
    { label: "Inventario", path: "/ver-inventario", icon: <BoltIcon className="w-4 h-4" /> },
  ],
  tech: [
    { label: "Mis Órdenes", path: "/ver-orden", icon: <ClipboardDocumentCheckIcon className="w-4 h-4" /> },
  ],
  recep: [
    { label: "Nueva Orden", path: "/ver-orden", icon: <PlusIcon className="w-4 h-4" /> },
    { label: "Clientes", path: "/ver-usuario", icon: <UserCircleIcon className="w-4 h-4" /> },
    { label: "Equipos", path: "/ver-equipo", icon: <BoltIcon className="w-4 h-4" /> },
  ],
  client: [
    { label: "Mis Órdenes", path: "/ver-orden", icon: <ClipboardDocumentCheckIcon className="w-4 h-4" /> },
    { label: "Pagos", path: "/ver-presupuesto", icon: <ChartBarIcon className="w-4 h-4" /> },
    { label: "Perfil", path: "/profile", icon: <UserCircleIcon className="w-4 h-4" /> },
  ],
};

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function severityToBadgeColor(severity: string): BadgeColor {
  if (severity === "error") return "error";
  if (severity === "warning") return "warning";
  if (severity === "success") return "success";
  return "info";
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function RoleDashboard() {
  const router = useRouter();
  const { data, loading, error, range, setRange, refetch } = useDashboard("30d");

  const kpiIcons: Record<string, React.ReactNode> = {
    "total-orders": <ClipboardDocumentCheckIcon className="w-6 h-6" />,
    "active-orders": <ArrowPathIcon className="w-6 h-6" />,
    "pending-budgets": <ChartBarIcon className="w-6 h-6" />,
    "unread-notifications": <BellIcon className="w-6 h-6" />,
  };

  const kpiColors: Record<string, string> = {
    "total-orders": "text-brand-500 bg-brand-500/10",
    "active-orders": "text-amber-500 bg-amber-500/10",
    "pending-budgets": "text-blue-500 bg-blue-500/10",
    "unread-notifications": "text-rose-500 bg-rose-500/10",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Cargando..." />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageBreadcrumb pageTitle="Dashboard" />
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center dark:border-rose-900/30 dark:bg-rose-900/10">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-400">Error de Conexión</h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error || "No hay datos disponibles."}</p>
          <Button onClick={() => void refetch()} className="mt-6" variant="primary">Reintentar</Button>
        </div>
      </div>
    );
  }

  const roleTitle = ROLE_TITLES[data.role] || "Dashboard";
  const chart = data.charts[0];
  const quickActions = QUICK_ACTIONS[data.role] || QUICK_ACTIONS.client;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageBreadcrumb pageTitle={roleTitle} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Última actualización: {formatDate(data.generatedAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => void setRange(option.value)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === option.value 
                ? 'bg-white dark:bg-gray-700 text-brand-500 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <motion.div
            key={kpi.key}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="relative overflow-hidden group p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] transition-transform group-hover:scale-110`}>
                {kpiIcons[kpi.key] || <BoltIcon />}
            </div>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${kpiColors[kpi.key] || 'bg-gray-100 text-gray-500'}`}>
                {kpiIcons[kpi.key] || <BoltIcon className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                  {kpi.value}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Section */}
        <motion.div variants={itemVariants} className="col-span-12 xl:col-span-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                        <ChartBarIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{chart?.title || "Estado de Órdenes"}</h2>
                </div>
            </div>

            {chart && chart.categories.length > 0 ? (
              <div className="space-y-6">
                {chart.categories.map((category, index) => {
                  const value = chart.series[0]?.data[index] || 0;
                  const max = Math.max(...chart.series[0].data, 1);
                  const percentage = Math.round((value / max) * 100);
                  
                  return (
                    <div key={`${category}-${index}`} className="group">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-amber-500 transition-colors">{category}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">{percentage}%</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">{value}</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-700/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, percentage)}%` }}
                          transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-inner"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <BoltIcon className="w-12 h-12 opacity-20 mb-2" />
                <p className="text-sm">No hay datos suficientes para generar el gráfico</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Actions and Alerts */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <BoltIcon className="w-5 h-5 text-brand-500" />
                    Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action) => (
                    <button 
                        key={action.path}
                        onClick={() => router.push(action.path)}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-brand-500 group transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white dark:bg-gray-700 text-brand-500 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                {action.icon}
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors">{action.label}</span>
                        </div>
                        <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-white/80 transition-colors" />
                    </button>
                ))}
                </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm border-l-4 border-l-rose-500">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <BellIcon className="w-5 h-5 text-rose-500" />
                    Alertas Críticas
                </h3>
                <div className="space-y-4">
                    {data.alerts.length > 0 ? (
                    data.alerts.map((alert) => (
                        <div key={alert.id} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge size="sm" color={severityToBadgeColor(alert.severity)}>
                                    {alert.severity.toUpperCase()}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium text-rose-800 dark:text-rose-300 leading-relaxed">{alert.message}</p>
                        </div>
                    ))
                    ) : (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                        <ShieldCheckIcon className="w-5 h-5" />
                        <p className="text-sm font-bold">Todo bajo control</p>
                    </div>
                    )}
                </div>
            </div>
          </motion.div>
        </div>

        {/* Full Width Section: Recent Activity */}
        <motion.div variants={itemVariants} className="col-span-12">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-500/10 rounded-xl">
                            <ArrowPathIcon className="w-5 h-5 text-brand-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/ver-orden')}>
                        Ver Todo
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-800">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Orden</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Detalle</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Fecha</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {data.recent.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-100 dark:border-gray-700">
                                            #{item.title.split('#')[1] || '??'}
                                        </div>
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{item.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.subtitle}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <Badge size="sm" variant="light" color={item.status === 'Entregado' ? 'success' : 'primary'}>
                                        {item.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatDate(item.createdAt).split(',')[0]}</span>
                                        <span className="text-xs text-gray-400">{formatDate(item.createdAt).split(',')[1]}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
