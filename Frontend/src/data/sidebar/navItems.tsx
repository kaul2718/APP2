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
    roles: ["Administrador", "Técnico"],
    subItems: [
      {
        name: "Ecommerce",
        path: "/",
        pro: false,
        roles: ["Administrador", "Técnico", "Cliente"]
      }
    ],
  },
  {
    icon: <UserCircleIcon className="w-5 h-5" />,
    name: "Clientes",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Nuevo Usuario",
        path: "/ingresar-usuario",
        roles: ["Administrador"]
      },
      {
        name: "Ver Usuarios",
        path: "/ver-usuario",
        roles: ["Administrador"]
      },
    ],
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Orden de Servicio",
    roles: ["Administrador", "Técnico", "Cliente"],
    subItems: [
      {
        name: "Nueva Orden de Servicio",
        path: "/ingresar-orden",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ver Ordenes de Servicio",
        path: "/ver-orden",
        roles: ["Administrador", "Técnico", "Cliente"]
      },
    ],
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Actividad Técnica",
    roles: ["Administrador", "Técnico"],
    subItems: [
      {
        name: "Nueva Actividad Técnica",
        path: "/ingresar-actividad-tecnica",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ver Actividades Técnicas",
        path: "/ver-actividad-tecnica",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <ComputerDesktopIcon className="w-5 h-5" />,
    name: "Equipos",
    roles: ["Administrador", "Técnico"],
    subItems: [
      {
        name: "Nueva Marca",
        path: "/ingresar-marca",
        roles: ["Administrador"]
      },
      {
        name: "Ver Marcas",
        path: "/ver-marca",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Nuevo Tipo Equipo",
        path: "/ingresar-tipo-equipo",
        roles: ["Administrador"]
      },
      {
        name: "Ver Tipo Equipo",
        path: "/ver-tipo-equipo",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Nuevo Modelo",
        path: "/ingresar-modelo",
        roles: ["Administrador"]
      },
      {
        name: "Ver Modelos",
        path: "/ver-modelo",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Nuevo Equipo",
        path: "/ingresar-equipo",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ver Equipos",
        path: "/ver-equipo",
        roles: ["Administrador", "Técnico", "Cliente"]
      },
    ],
  },
  {
    icon: <RectangleGroupIcon className="w-5 h-5" />,
    name: "Casilleros",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Ingresar Casillero",
        path: "/ingresar-casillero",
        roles: ["Administrador"]
      },
      {
        name: "Ver Casilleros",
        path: "/ver-casillero",
        roles: ["Administrador"]
      },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Estados Orden Servicio",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Ingresar Estado Orden",
        path: "/ingresar-estado-orden",
        roles: ["Administrador"]
      },
      {
        name: "Ver Estados Orden",
        path: "/ver-estado-orden",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <ClipboardIcon className="w-5 h-5" />,
    name: "Tipo Actividad Tecnica",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Ingresar Tipo Actividad Tecnica",
        path: "/ingresar-tipo-actividad-tecnica",
        roles: ["Administrador"]
      },
      {
        name: "Ver Tipos Actividad Tecnica",
        path: "/ver-tipo-actividad-tecnica",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Presupuestos",
    roles: ["Administrador", "Técnico"],
    subItems: [
      {
        name: "Ingresar Presupuesto",
        path: "/ingresar-presupuesto",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ver Presupuestos",
        path: "/ver-presupuesto",
        roles: ["Administrador", "Técnico", "Cliente"]
      },
      {
        name: "Ingresar Detalle Mano de Obra",
        path: "/ingresar-detalle-mano-obra",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ver Mano de Obra",
        path: "/ver-detalle-mano-obra",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ingresar Detalle Repuesto",
        path: "/ingresar-detalle-repuesto",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ver Detalle Repuesto",
        path: "/ver-detalle-repuesto",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Estado Presupuesto",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Ingresar Estado Presupuesto",
        path: "/ingresar-estado-presupuesto",
        roles: ["Administrador"]
      },
      {
        name: "Ver Estados Presupuestos",
        path: "/ver-estado-presupuesto",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
    name: "Tipo Mano Obra",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Ingresar Tipo Mano Obra",
        path: "/ingresar-tipo-mano-obra",
        roles: ["Administrador"]
      },
      {
        name: "Ver Tipos de Mano Obra",
        path: "/ver-tipo-mano-obra",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    name: "Inventario / Partes",
    roles: ["Administrador", "Técnico"],
    subItems: [
      {
        name: "Ingresar Inventario",
        path: "/ingresar-inventario",
        roles: ["Administrador"]
      },
      {
        name: "Ver Inventario",
        path: "/ver-inventario",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ingresar Categoria",
        path: "/ingresar-categoria",
        roles: ["Administrador"]
      },
      {
        name: "Ver Categorias",
        path: "/ver-categoria",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ingresar Tipo Especificación",
        path: "/ingresar-tipo-especificacion",
        roles: ["Administrador"]
      },
      {
        name: "Ver Tipo Especificación",
        path: "/ver-tipo-especificacion",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ingresar Especificación Parte",
        path: "/ingresar-especificacion-parte",
        roles: ["Administrador"]
      },
      {
        name: "Ver Especificación Parte",
        path: "/ver-especificacion-parte",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ingresar Parte",
        path: "/ingresar-parte",
        roles: ["Administrador"]
      },
      {
        name: "Ver Partes",
        path: "/ver-parte",
        roles: ["Administrador", "Técnico"]
      },
      {
        name: "Ingresar Repuesto",
        path: "/ingresar-repuesto",
        roles: ["Administrador"]
      },
      {
        name: "Ver Repuestos",
        path: "/ver-repuesto",
        roles: ["Administrador", "Técnico"]
      },
    ],
  },
  {
    icon: <BellAlertIcon className="w-5 h-5" />,
    name: "Tipo Notificación",
    roles: ["Administrador"],
    subItems: [
      {
        name: "Ingresar Tipo Notificación",
        path: "/ingresar-tipo-notificacion",
        roles: ["Administrador"]
      },
      {
        name: "Ver Tipos de Notificación",
        path: "/ver-tipo-notificacion",
        roles: ["Administrador"]
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