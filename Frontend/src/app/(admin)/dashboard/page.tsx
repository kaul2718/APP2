import type { Metadata } from "next";
import React from "react";
import RoleDashboard from "@/components/dashboard/RoleDashboard";

export const metadata: Metadata = {
  title: "Dashboard | Sistema de Servicio Técnico",
  description: "Dashboard principal por rol para el sistema de servicio técnico",
};

export default function DashboardPage() {
  return <RoleDashboard />;
}
