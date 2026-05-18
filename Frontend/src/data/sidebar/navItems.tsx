import React from "react";
import { useSession } from "next-auth/react";
import {
  Squares2X2Icon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  Cog8ToothIcon,
} from "@heroicons/react/24/outline";

export type SubNavItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  roles: string[];
};

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubNavItem[];
  roles: string[];
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
    name: "Clientes",
    roles: ["admin"],
    subItems: [
      {
        name: "Usuarios",
        path: "/ver-usuario",
        roles: ["admin"]
      },
    ],
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Órdenes de Servicio",
    roles: ["admin", "tech", "client"],
    subItems: [
      {
        name: "Órdenes",
        path: "/ver-orden",
        roles: ["admin", "tech", "client"]
      },
    ],
  },
  {
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    name: "Almacén",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Catálogo e Inventario",
        path: "/items",
        roles: ["admin", "tech"],
      },
      {
        name: "Ajuste de Inventario",
        path: "/items/ajuste",
        roles: ["admin", "tech"],
        new: true,
      },
      {
        name: "Compras y Facturación",
        path: "/items/compras",
        roles: ["admin", "tech"],
        new: true,
      },
      {
        name: "Proveedores",
        path: "/items/compras/proveedores",
        roles: ["admin", "tech"],
      },
      {
        name: "Categorías",
        path: "/ver-categoria",
        roles: ["admin", "tech"]
      },
      {
        name: "Checklists (Peritaje)",
        path: "/ver-checklist",
        roles: ["admin"]
      },
    ],
  },
  {
    icon: <Cog8ToothIcon className="w-5 h-5" />,
    name: "Administración",
    path: "/admin",
    roles: ["admin"],
  },
];

// Hook para obtener el rol del usuario
export const useUserRole = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  return session?.user?.role || null;
};

// Función para filtrar los items de navegación según el rol
export const getFilteredNavItems = (role: string | null) => {
  if (!role) return [];

  return navItems
    .filter(item => item.roles.includes(role))
    .map(item => ({
      ...item,
      subItems: item.subItems?.filter(subItem => subItem.roles.includes(role)) || undefined
    }));
};