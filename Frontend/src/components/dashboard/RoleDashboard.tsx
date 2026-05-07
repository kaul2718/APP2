"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge, { type BadgeColor } from "@/components/ui/badge/Badge";
import { useDashboard } from "@/hooks/useDashboard";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

const ROLE_TITLES: Record<string, string> = {
  admin: "Dashboard Administrador",
  tech: "Dashboard Técnico",
  recep: "Dashboard Recepcionista",
  client: "Mi Dashboard",
};

const QUICK_ACTIONS: Record<string, Array<{ label: string; path: string }>> = {
  admin: [
    { label: "Ver órdenes", path: "/ver-orden" },
    { label: "Ver presupuestos", path: "/ver-presupuesto" },
    { label: "Ver inventario", path: "/ver-inventario" },
  ],
  tech: [
    { label: "Mis órdenes", path: "/ver-orden" },
    { label: "Actividades técnicas", path: "/ver-actividad-tecnica" },
    { label: "Presupuestos", path: "/ver-presupuesto" },
  ],
  recep: [
    { label: "Registrar orden", path: "/ver-orden" },
    { label: "Ver clientes", path: "/ver-usuario" },
    { label: "Ver equipos", path: "/ver-equipo" },
  ],
  client: [
    { label: "Mis órdenes", path: "/ver-orden" },
    { label: "Mis presupuestos", path: "/ver-presupuesto" },
    { label: "Mi perfil", path: "/profile" },
  ],
};

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
  });
}

export default function RoleDashboard() {
  const router = useRouter();
  const { data, loading, error, range, setRange, refetch } = useDashboard("30d");

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Dashboard" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Dashboard" />
        <ComponentCard title="No se pudo cargar el dashboard">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {error || "No hay datos disponibles para mostrar."}
            </p>
            <Button onClick={() => void refetch()}>Reintentar</Button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  const roleTitle = ROLE_TITLES[data.role] || "Dashboard";
  const chart = data.charts[0];
  const quickActions = QUICK_ACTIONS[data.role] || QUICK_ACTIONS.client;

  return (
    <div>
      <PageBreadcrumb pageTitle={roleTitle} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Última actualización: {formatDate(data.generatedAt)}
        </p>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={range === option.value ? "primary" : "outline"}
              onClick={() => void setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <ComponentCard title={chart?.title || "Distribución"}>
            {chart && chart.categories.length > 0 ? (
              <div className="space-y-3">
                {chart.categories.map((category, index) => {
                  const value = chart.series[0]?.data[index] || 0;
                  const max = Math.max(...chart.series[0].data, 1);
                  const width = `${Math.max(8, Math.round((value / max) * 100))}%`;

                  return (
                    <div key={`${category}-${index}`}>
                      <div className="mb-1 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span>{category}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de estados para el rango seleccionado.</p>
            )}
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <ComponentCard title="Acciones rápidas">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button key={action.path} variant="outline" size="sm" onClick={() => router.push(action.path)}>
                  {action.label}
                </Button>
              ))}
            </div>
          </ComponentCard>

          <div className="mt-4">
            <ComponentCard title="Alertas">
              <div className="space-y-2">
                {data.alerts.length > 0 ? (
                  data.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-2">
                      <Badge size="sm" color={severityToBadgeColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sin alertas por mostrar.</p>
                )}
              </div>
            </ComponentCard>
          </div>
        </div>

        <div className="col-span-12">
          <ComponentCard title="Actividad reciente">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Orden</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Detalle</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {data.recent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-800 dark:text-white/90">{item.title}</td>
                      <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{item.subtitle}</td>
                      <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{item.status}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
