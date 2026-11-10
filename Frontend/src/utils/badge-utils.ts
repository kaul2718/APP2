// src/utils/badge-utils.ts

import type { BadgeColor } from "@/components/ui/badge/Badge";

export function getEstadoColor(nombre: string): BadgeColor {
  const normalized = (nombre || '').toLowerCase();

  if (normalized.includes("espera de repuesto") || normalized.includes("repuesto")) return "warning";
  if (normalized.includes("pendiente de aprobación") || normalized.includes("pendiente")) return "warning";
  if (normalized.includes("servicio") || normalized.includes("proceso") || normalized.includes("reparación")) return "info";
  if (normalized.includes("diagnóstico")) return "info";
  if (normalized.includes("listo para entrega") || normalized.includes("listo")) return "warning";
  if (normalized.includes("entregado") || normalized.includes("entreg")) return "success";
  if (normalized.includes("cancelado") || normalized.includes("no reparado") || normalized.includes("rechaz")) return "error";
  if (normalized.includes("recepción") || normalized.includes("recep") || normalized.includes("ingres")) return "light";

  return "primary"; // fallback por defecto
}
