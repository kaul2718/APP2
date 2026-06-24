'use client';

import React from "react";
import OrdenComponent from "./OrdenComponent";
import ClientOrderComponent from "./ClientOrderComponent";
import { usePermissions } from "@/hooks/usePermissions";

export default function Page() {
  const { role, loading } = usePermissions();

  if (loading) return null;

  if (role === 'client') {
    return <ClientOrderComponent />;
  }

  return <OrdenComponent />;
}
