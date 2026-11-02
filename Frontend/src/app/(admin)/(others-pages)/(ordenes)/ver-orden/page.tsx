'use client';

import React, { Suspense } from "react";
import OrdenComponent from "./OrdenComponent";
import ClientOrderComponent from "./ClientOrderComponent";
import { usePermissions } from "@/hooks/usePermissions";

export default function Page() {
  const { role, loading } = usePermissions();

  if (loading) return null;

  return (
    <Suspense fallback={<div className="p-6">Cargando órdenes...</div>}>
      {role === 'client' ? <ClientOrderComponent /> : <OrdenComponent />}
    </Suspense>
  );
}
