import React from "react";
import { useSession } from "next-auth/react";
import {
  Squares2X2Icon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  RectangleGroupIcon,
  DocumentTextIcon,
  ClipboardIcon,
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
  BellAlertIcon,
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
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Ecommerce",
        path: "/",
        pro: false,
        roles: ["admin", "tech", "client"]
      }
    ],
  },
  {
    icon: <UserCircleIcon className="w-5 h-5" />,
    name: "Clientes",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Usuarios",
        path: "/ver-usuario",
        roles: ["admin"]
      },
    ],
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Orden de Servicio",
    roles: ["admin", "tech", "client"],
    subItems: [
      {
        name: "Ver Ordenes de Servicio",
        path: "/ver-orden",
        roles: ["admin", "tech", "client"]
      },
    ],
  },
  {
    icon: <ComputerDesktopIcon className="w-5 h-5" />,
    name: "Equipos",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Marcas",
        path: "/ver-marca",
        roles: ["admin", "tech"]
      },
      {
        name: "Tipo Equipo",
        path: "/ver-tipo-equipo",
        roles: ["admin", "tech"]
      },
      {
        name: "Modelos",
        path: "/ver-modelo",
        roles: ["admin", "tech"]
      },
      {
        name: "Equipos",
        path: "/ver-equipo",
        roles: ["admin", "tech", "client"]
      },
    ],
  },
  {
    icon: <RectangleGroupIcon className="w-5 h-5" />,
    name: "Casilleros",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Casilleros",
        path: "/ver-casillero",
        roles: ["admin"]
      },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Estados Orden Servicio",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Estados Orden",
        path: "/ver-estado-orden",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <ClipboardIcon className="w-5 h-5" />,
    name: "Tipo Actividad Tecnica",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Tipos Actividad Tecnica",
        path: "/ver-tipo-actividad-tecnica",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Presupuestos",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Ver Presupuestos",
        path: "/ver-presupuesto",
        roles: ["admin", "tech", "client"]
      },
      {
        name: "Ver Mano de Obra",
        path: "/ver-detalle-mano-obra",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Detalle de Ítems",
        path: "/ver-detalle-presupuesto-item",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Estado Presupuesto",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Estados Presupuestos",
        path: "/ver-estado-presupuesto",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
    name: "Tipo Mano Obra",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Tipos de Mano Obra",
        path: "/ver-tipo-mano-obra",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    name: "Inventario / Catálogo",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Inventario",
        path: "/ver-inventario",
        roles: ["admin", "tech"]
      },
      {
        name: "Categorias",
        path: "/ver-categoria",
        roles: ["admin", "tech"]
      },
      {
        name: "Catálogo de Ítems",
        path: "/ver-parte",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <BellAlertIcon className="w-5 h-5" />,
    name: "Tipo Notificación",
    roles: ["admin"],
    subItems: [
      {
        name: "Ver Tipos de Notificación",
        path: "/ver-tipo-notificacion",
        roles: ["admin"]
      },
    ],
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
      subItems: item.subItems?.filter(subItem => subItem.roles.includes(role)) || []
    }));
};