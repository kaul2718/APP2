// src/data/sidebar/navItems.tsx
import React from "react";
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
  PuzzlePieceIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

export type SubNavItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
};

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubNavItem[];
};

export const navItems: NavItem[] = [
  {
    icon: <Squares2X2Icon className="w-5 h-5" />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  },
  {
    icon: <UserCircleIcon className="w-5 h-5" />,
    name: "Clientes",
    subItems: [
      { name: "Nuevo Usuario", path: "/ingresar-usuario" },
      { name: "Ver Usuarios", path: "/ver-usuario" },
    ],
  },
  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Orden de Servicio",
    subItems: [
      { name: "Nueva Orden de Servicio", path: "/ingresar-orden" },
      { name: "Ver Ordenes de Servicio", path: "/ver-orden" },
    ],
  },

  {
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    name: "Actividad Técnica",
    subItems: [
      { name: "Nueva Actividad Técnica", path: "/ingresar-actividad-tecnica" },
      { name: "Ver Actividades Técnicas", path: "/ver-actividad-tecnica" },
    ],
  },
  {
    icon: <ComputerDesktopIcon className="w-5 h-5" />,
    name: "Equipos",
    subItems: [
      { name: "Nueva Marca", path: "/ingresar-marca" },
      { name: "Ver Marcas", path: "/ver-marca" },
      { name: "Nuevo Tipo Equipo", path: "/ingresar-tipo-equipo" },
      { name: "Ver Tipo Equipo", path: "/ver-tipo-equipo" },
      { name: "Nuevo Modelo", path: "/ingresar-modelo" },
      { name: "Ver Modelos", path: "/ver-modelo" },
      { name: "Nuevo Equipo", path: "/ingresar-equipo" },
      { name: "Ver Equipos", path: "/ver-equipo" },
    ],
  },
  {
    icon: <RectangleGroupIcon className="w-5 h-5" />,
    name: "Casilleros",
    subItems: [
      { name: "Ingresar Casillero", path: "/ingresar-casillero" },
      { name: "Ver Casilleros", path: "/ver-casillero" },
    ],
  },
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Estados Orden Servicio",
    subItems: [
      { name: "Ingresar Estado Orden", path: "/ingresar-estado-orden" },
      { name: "Ver Estados Orden", path: "/ver-estado-orden" },
    ],
  },
  {
    icon: <ClipboardIcon className="w-5 h-5" />,
    name: "Tipo Actividad Tecnica",
    subItems: [
      { name: "Ingresar Tipo Actividad Tecnica", path: "/ingresar-tipo-actividad-tecnica" },
      { name: "Ver Tipos Actividad Tecnica", path: "/ver-tipo-actividad-tecnica" },
    ],
  },

  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Presupuestos",
    subItems: [
      { name: "Ingresar  Presupuesto", path: "/ingresar-estado-presupuesto" },
      { name: "Ver  Presupuestos", path: "/ver-estado-presupuesto" },
      { name: "Ingresar Detalle Mano de Obra", path: "/ingresar-detalle-mano-obra" },
      { name: "Ver  Mano de Obra", path: "/ver-detalle-mano-obra" },
      { name: "Ingresar  Detalle Repuesto", path: "/ingresar-detalle-repuesto" },
      { name: "Ver Detalle Repuesto", path: "/ver-detalle-repuesto" },
    ],
  },

  
  {
    icon: <DocumentTextIcon className="w-5 h-5" />,
    name: "Estado Presupuesto",
    subItems: [
      { name: "Ingresar Estado Presupuesto", path: "/ingresar-estado-presupuesto" },
      { name: "Ver Estados Presupuestos", path: "/ver-estado-presupuesto" },
    ],
  },
  
  {
    icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
    name: "Tipo Mano Obra",
    subItems: [
      { name: "Ingresar Tipo Mano Obra", path: "/ingresar-tipo-mano-obra" },
      { name: "Ver Tipos de Mano Obra", path: "/ver-tipo-mano-obra" },
    ],
  },
  {
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    name: "Inventario / Partes",
    subItems: [
      { name: "Ingresar Inventario", path: "/ingresar-inventario" },
      { name: "Ver Inventario", path: "/ver-inventario" },

      { name: "Ingresar Categoria", path: "/ingresar-categoria" },
      { name: "Ver Categorias", path: "/ver-categoria" },

      { name: "Ingresar Tipo Especificación", path: "/ingresar-tipo-especificacion" },
      { name: "Ver Tipo Especificación", path: "/ver-tipo-especificacion" },

      { name: "Ingresar Especificación Parte", path: "/ingresar-especificacion-parte" },
      { name: "Ver Especificación Parte", path: "/ver-especificacion-parte" },

      { name: "Ingresar Parte", path: "/ingresar-parte" },
      { name: "Ver Partes", path: "/ver-parte" },

      { name: "Ingresar Repuesto", path: "/ingresar-repuesto" },
      { name: "Ver Repuestos", path: "/ver-repuesto" },


    ],
  },
  {
    icon: <BellAlertIcon className="w-5 h-5" />,
    name: "Tipo Notificación",
    subItems: [
      { name: "Ingresar Tipo Notificación", path: "/ingresar-tipo-notificacion" },
      { name: "Ver Tipos de Notificación", path: "/ver-tipo-notificacion" },
    ],
  },
];
