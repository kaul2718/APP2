"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ComputerDesktopIcon,
  RectangleGroupIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
  Square3Stack3DIcon,
  CpuChipIcon,
  SwatchIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminItem {
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

interface AdminGroup {
  id: string;
  title: string;
  color: string;
  dotColor: string;
  icon: React.ReactNode;
  items: AdminItem[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const adminGroups: AdminGroup[] = [
  {
    id: "equipos",
    title: "Equipos",
    color: "text-brand-500",
    dotColor: "bg-brand-500",
    icon: <ComputerDesktopIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Marcas", description: "Fabricantes disponibles", path: "/ver-marca", icon: <TagIcon className="w-3.5 h-3.5" /> },
      { label: "Tipos de Equipo", description: "Categorías de dispositivos", path: "/ver-tipo-equipo", icon: <SwatchIcon className="w-3.5 h-3.5" /> },
      { label: "Modelos", description: "Modelos por marca", path: "/ver-modelo", icon: <CpuChipIcon className="w-3.5 h-3.5" /> },
      { label: "Equipos", description: "Registro global de equipos", path: "/ver-equipo", icon: <ComputerDesktopIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "casilleros",
    title: "Casilleros",
    color: "text-theme-purple-500",
    dotColor: "bg-theme-purple-500",
    icon: <RectangleGroupIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Casilleros", description: "Espacios físicos del taller", path: "/ver-casillero", icon: <RectangleGroupIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "flujo-ordenes",
    title: "Flujo de Órdenes",
    color: "text-success-600",
    dotColor: "bg-success-500",
    icon: <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Estados de Orden", description: "Etapas del ciclo de una ODS", path: "/ver-estado-orden", icon: <Square3Stack3DIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "actividades",
    title: "Actividades Técnicas",
    color: "text-blue-light-500",
    dotColor: "bg-blue-light-500",
    icon: <WrenchScrewdriverIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Tipos de Actividad", description: "Catálogo de actividades", path: "/ver-tipo-actividad-tecnica", icon: <WrenchScrewdriverIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "presupuestos",
    title: "Presupuestos",
    color: "text-warning-600",
    dotColor: "bg-warning-500",
    icon: <BanknotesIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Presupuestos", description: "Gestión de presupuestos", path: "/ver-presupuesto", icon: <BanknotesIcon className="w-3.5 h-3.5" /> },
      { label: "Estados de Presupuesto", description: "Ciclo de aprobación", path: "/ver-estado-presupuesto", icon: <Square3Stack3DIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "notificaciones",
    title: "Notificaciones",
    color: "text-error-500",
    dotColor: "bg-error-500",
    icon: <BellAlertIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Tipos de Notificación", description: "Categorías de alertas", path: "/ver-tipo-notificacion", icon: <BellAlertIcon className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad y Accesos",
    color: "text-amber-500",
    dotColor: "bg-amber-500",
    icon: <ShieldCheckIcon className="w-3.5 h-3.5" />,
    items: [
      { label: "Gestión de Roles", description: "Administrar roles de usuarios y sus accesos", path: "/ver-roles", icon: <ShieldCheckIcon className="w-3.5 h-3.5" /> },
      { label: "Catálogo de Permisos", description: "Administrar permisos de módulos del sistema", path: "/ver-permisos", icon: <KeyIcon className="w-3.5 h-3.5" /> },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────
function AccordionGroup({
  group,
  defaultOpen = false,
  forceOpen = false,
}: {
  group: AdminGroup;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen || open;

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <button
        onClick={() => !forceOpen && setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        {/* Dot indicator */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${group.dotColor}`} />

        {/* Icon + title */}
        <span className={`flex-shrink-0 ${group.color}`}>{group.icon}</span>
        <span className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-100">
          {group.title}
        </span>

        {/* Count badge */}
        <span className="text-sm text-gray-400 dark:text-gray-600 tabular-nums mr-1">
          {group.items.length}
        </span>

        {/* Chevron */}
        {!forceOpen && (
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        )}
      </button>

      {/* Collapsible items */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: isOpen ? `${group.items.length * 64}px` : "0px" }}
      >
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/60">
          {group.items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <span className="w-2 flex-shrink-0" />
              <span className={`flex-shrink-0 ${group.color} opacity-50 group-hover:opacity-90 transition-opacity`}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">
                  {item.label}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {item.description}
                </span>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return adminGroups;
    const q = search.toLowerCase();
    return adminGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q)
        ),
      }))
      .filter(
        (g) =>
          g.items.length > 0 || g.title.toLowerCase().includes(q)
      );
  }, [search]);

  const isSearching = search.trim().length > 0;

  return (
    <div className="p-3 md:p-5 mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Administración
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {adminGroups.length} secciones &middot; {adminGroups.reduce((a, g) => a + g.items.length, 0)} configuraciones
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar configuración..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-xs rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all shadow-theme-xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Accordion Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map((group, i) => (
            <AccordionGroup
              key={group.id}
              group={group}
              defaultOpen={i === 0}
              forceOpen={isSearching}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <MagnifyingGlassIcon className="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-1.5 text-xs text-brand-500 hover:text-brand-600 transition-colors"
          >
            Ver todo
          </button>
        </div>
      )}
    </div>
  );
}
