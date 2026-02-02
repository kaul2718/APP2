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
        name: "Nuevo Usuario",
        path: "/ingresar-usuario",
        roles: ["admin"]
      },
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
        name: "Nueva Orden de Servicio",
        path: "/ingresar-orden",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Ordenes de Servicio",
        path: "/ver-orden",
        roles: ["admin", "tech", "client"]
      },
    ],
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Actividad Técnica",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Nueva Actividad Técnica",
        path: "/ingresar-actividad-tecnica",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Actividades Técnicas",
        path: "/ver-actividad-tecnica",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <ComputerDesktopIcon className="w-5 h-5" />,
    name: "Equipos",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Nueva Marca",
        path: "/ingresar-marca",
        roles: ["admin"]
      },
      {
        name: "Ver Marcas",
        path: "/ver-marca",
        roles: ["admin", "tech"]
      },
      {
        name: "Nuevo Tipo Equipo",
        path: "/ingresar-tipo-equipo",
        roles: ["admin"]
      },
      {
        name: "Ver Tipo Equipo",
        path: "/ver-tipo-equipo",
        roles: ["admin", "tech"]
      },
      {
        name: "Nuevo Modelo",
        path: "/ingresar-modelo",
        roles: ["admin"]
      },
      {
        name: "Ver Modelos",
        path: "/ver-modelo",
        roles: ["admin", "tech"]
      },
      {
        name: "Nuevo Equipo",
        path: "/ingresar-equipo",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Equipos",
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
        name: "Ingresar Casillero",
        path: "/ingresar-casillero",
        roles: ["admin"]
      },
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
        name: "Ingresar Estado Orden",
        path: "/ingresar-estado-orden",
        roles: ["admin"]
      },
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
        name: "Ingresar Tipo Actividad Tecnica",
        path: "/ingresar-tipo-actividad-tecnica",
        roles: ["admin"]
      },
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
        name: "Ingresar Presupuesto",
        path: "/ingresar-presupuesto",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Presupuestos",
        path: "/ver-presupuesto",
        roles: ["admin", "tech", "client"]
      },
      {
        name: "Ingresar Detalle Mano de Obra",
        path: "/ingresar-detalle-mano-obra",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Mano de Obra",
        path: "/ver-detalle-mano-obra",
        roles: ["admin", "tech"]
      },
      {
        name: "Ingresar Detalle Repuesto",
        path: "/ingresar-detalle-repuesto",
        roles: ["admin", "tech"]
      },
      {
        name: "Ver Detalle Repuesto",
        path: "/ver-detalle-repuesto",
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
        name: "Ingresar Estado Presupuesto",
        path: "/ingresar-estado-presupuesto",
        roles: ["admin"]
      },
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
        name: "Ingresar Tipo Mano Obra",
        path: "/ingresar-tipo-mano-obra",
        roles: ["admin"]
      },
      {
        name: "Ver Tipos de Mano Obra",
        path: "/ver-tipo-mano-obra",
        roles: ["admin", "tech"]
      },
    ],
  },
  {
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    name: "Inventario / Partes",
    roles: ["admin", "tech"],
    subItems: [
      {
        name: "Ingresar Inventario",
        path: "/ingresar-inventario",
        roles: ["admin"]
      },
      {
        name: "Ver Inventario",
        path: "/ver-inventario",
        roles: ["admin", "tech"]
      },
      {
        name: "Ingresar Categoria",
        path: "/ingresar-categoria",
        roles: ["admin"]
      },
      {
        name: "Ver Categorias",
        path: "/ver-categoria",
        roles: ["admin", "tech"]
      },
      {
        name: "Ingresar Tipo Especificación",
        path: "/ingresar-tipo-especificacion",
        roles: ["admin"]
      },
      {
        name: "Ver Tipo Especificación",
        path: "/ver-tipo-especificacion",
        roles: ["admin", "tech"]
      },
      {
        name: "Ingresar Especificación Parte",
        path: "/ingresar-especificacion-parte",
        roles: ["admin"]
      },
      {
        name: "Ver Especificación Parte",
        path: "/ver-especificacion-parte",
        roles: ["admin", "tech"]
      },
      {
        name: "Ingresar Parte",
        path: "/ingresar-parte",
        roles: ["admin"]
      },
      {
        name: "Ver Partes",
        path: "/ver-parte",
        roles: ["admin", "tech"]
      },
      {
        name: "Ingresar Repuesto",
        path: "/ingresar-repuesto",
        roles: ["admin"]
      },
      {
        name: "Ver Repuestos",
        path: "/ver-repuesto",
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
        name: "Ingresar Tipo Notificación",
        path: "/ingresar-tipo-notificacion",
        roles: ["admin"]
      },
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