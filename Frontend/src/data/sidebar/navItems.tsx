import React from "react";
import { useSession } from "next-auth/react";
import {
  Squares2X2Icon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  Cog8ToothIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export type SubNavItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  roles: string[];
  permission?: string; // Nuevo campo opcional para autorizar por permisos de base de datos
};

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubNavItem[];
  roles: string[];
  permission?: string; // Nuevo campo opcional para autorizar por permisos de base de datos
};

export const navItems: NavItem[] = [
  {
    icon: <Squares2X2Icon className="w-5 h-5" />,
    name: "Dashboard",
    path: "/dashboard",
    roles: ["admin", "tech", "recep", "client"],
  },
  {
    icon: <UserCircleIcon className="w-5 h-5" />,
    name: "Usuarios",
    path: "/ver-usuario",
    roles: ["admin"],
    permission: "users.view",
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Órdenes de Servicio",
    roles: ["admin", "tech", "client"],
    subItems: [
      {
        name: "Órdenes",
        path: "/ver-orden",
        roles: ["admin", "tech", "client"],
        permission: "orders.view",
      },
    ],
  },
  {
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    name: "Almacén",
    roles: ["admin", "tech", "recep"],
    subItems: [
      {
        name: "Catálogo e Inventario",
        path: "/items",
        roles: ["admin", "tech", "recep"],
        permission: "almacen.view",
      },
      {
        name: "Ajuste de Inventario",
        path: "/items/ajuste",
        roles: ["admin", "tech", "recep"],
        permission: "almacen.manage",
        new: true,
      },
      {
        name: "Compras y Facturación",
        path: "/items/compras",
        roles: ["admin", "tech", "recep"],
        permission: "almacen.manage",
        new: true,
      },
      {
        name: "Proveedores",
        path: "/items/compras/proveedores",
        roles: ["admin", "tech", "recep"],
        permission: "almacen.manage",
      },
      {
        name: "Categorías",
        path: "/ver-categoria",
        roles: ["admin", "tech", "recep"],
        permission: "almacen.view",
      },
      {
        name: "Checklists (Peritaje)",
        path: "/ver-checklist",
        roles: ["admin", "tech", "recep"],
        permission: "checklists.view",
      },
    ],
  },
  {
    icon: <ChartBarIcon className="w-5 h-5" />,
    name: "Reportes",
    roles: ["admin"],
    permission: "reportes.view",
    subItems: [
      {
        name: "Clientes",
        path: "/reportes/clientes",
        roles: ["admin"],
        permission: "reportes.view",
      },
      {
        name: "Inventario",
        path: "/reportes/inventario",
        roles: ["admin"],
        permission: "reportes.view",
      },
      {
        name: "Compras",
        path: "/reportes/compras",
        roles: ["admin"],
        permission: "reportes.view",
      },
      {
        name: "Presupuestos",
        path: "/reportes/presupuestos",
        roles: ["admin"],
        permission: "reportes.view",
      },
      {
        name: "Órdenes de Servicio",
        path: "/reportes/ordenes",
        roles: ["admin"],
        permission: "reportes.view",
      },
      {
        name: "Técnicos",
        path: "/reportes/tecnicos",
        roles: ["admin"],
        permission: "reportes.view",
      },
      {
        name: "Equipos",
        path: "/reportes/equipos",
        roles: ["admin"],
        permission: "reportes.view",
      },
    ],
  },
  {
    icon: <EyeIcon className="w-5 h-5" />,
    name: "Actividad del sistema",
    roles: ["admin"],
    subItems: [
      {
        name: "Auditoría interna",
        path: "/actividad-sistema/auditoria",
        roles: ["admin"],
        permission: "audit.view",
      },
      {
        name: "Comportamiento de clientes",
        path: "/actividad-sistema/clientes",
        roles: ["admin"],
        permission: "analytics.clients.view",
      },
    ],
  },
  {
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    name: "Firma Electrónica",
    path: "/ver-firma-electronica",
    roles: ["admin"],
    permission: "roles.manage",
  },
  {
    icon: <Cog8ToothIcon className="w-5 h-5" />,
    name: "Administración",
    path: "/admin",
    roles: ["admin"],
    permission: "roles.manage",
  },
];

// Hook para obtener el rol del usuario
export const useUserRole = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  return session?.user?.role || null;
};

// Función para filtrar los items de navegación según todos los roles y permisos efectivos
export const getFilteredNavItems = (
  roleOrRoles: string | string[] | null,
  permissions: string[] = []
) => {
  const userRoles = Array.isArray(roleOrRoles)
    ? roleOrRoles.filter(Boolean)
    : roleOrRoles
      ? [roleOrRoles]
      : [];

  if (userRoles.length === 0) return [];

  const isAdmin = userRoles.includes("admin");
  const isClient = userRoles.includes("client") || userRoles.includes("cliente");

  const hasItemAccess = (entry: { permission?: string; roles?: string[] }) => {
    if (isAdmin) return true;
    if (entry.permission && permissions.includes(entry.permission)) return true;
    if (isClient && entry.roles?.includes("client")) return true;
    // Para items sin permiso específico, verificar si alguno de los roles coincide
    if (!entry.permission && entry.roles) {
      return entry.roles.some((r) => userRoles.includes(r));
    }
    return false;
  };

  return navItems
    .filter(item => {
      if (item.subItems) {
        return item.subItems.some(sub => hasItemAccess(sub));
      }
      return hasItemAccess(item);
    })
    .map(item => {
      if (item.subItems) {
        const filteredSub = item.subItems.filter(sub => hasItemAccess(sub));
        return {
          ...item,
          subItems: filteredSub.length > 0 ? filteredSub : undefined,
        };
      }
      return item;
    });
};