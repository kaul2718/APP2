import React from "react";
import { useSession } from "next-auth/react";
import {
  Squares2X2Icon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  Cog8ToothIcon,
  ChartBarIcon,
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

// Función para filtrar los items de navegación según los permisos en tiempo real
export const getFilteredNavItems = (role: string | null, permissions: string[] = []) => {
  if (!role) return [];

  const isAdmin = role === "admin";

  return navItems
    .filter(item => {
      // 1. Si el item requiere un permiso específico, verificar si el usuario lo tiene (o es admin)
      if (item.permission) {
        const hasPerm = isAdmin || permissions.includes(item.permission);
        if (!hasPerm) return false;
      }

      // 2. Si es un menú contenedor (con subItems), mostrarlo si al menos un subItem es visible
      if (item.subItems) {
        const hasVisibleSubItem = item.subItems.some(sub => {
          if (sub.permission) {
            const hasPerm = isAdmin || permissions.includes(sub.permission);
            return hasPerm;
          }
          return true;
        });
        return hasVisibleSubItem;
      }

      return true;
    })
    .map(item => {
      // Filtrar los subItems internos del item de acuerdo a sus permisos individuales
      if (item.subItems) {
        const filteredSub = item.subItems.filter(sub => {
          if (sub.permission) {
            const hasPerm = isAdmin || permissions.includes(sub.permission);
            return hasPerm;
          }
          return true;
        });

        return {
          ...item,
          subItems: filteredSub.length > 0 ? filteredSub : undefined,
        };
      }

      return item;
    });
};