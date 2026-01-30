// src/utils/badge-utils.ts

import type { BadgeColor } from "@/components/ui/badge/Badge";

export function getEstadoColor(nombre: string): BadgeColor {
  const normalized = nombre.toLowerCase();

  if (normalized.includes("pendiente")) return "warning";
  if (normalized.includes("proceso") || normalized.includes("reparación")) return "info";
  if (normalized.includes("entregado")) return "success";
  if (normalized.includes("espera de repuesto")) return "warning";
  if (normalized.includes("diagnóstico")) return "info";
  if (normalized.includes("reparado") || normalized.includes("listo")) return "success";
  if (normalized.includes("cancelado") || normalized.includes("no reparado") || normalized.includes("irreparable")) return "error";
  if (normalized.includes("reingresado") || normalized.includes("segunda revisión")) return "dark";
  if (normalized.includes("recepcionado") || normalized.includes("ingresado")) return "light";
  if (normalized.includes("completo")) return "primary";

  return "primary"; // fallback por defecto
}
