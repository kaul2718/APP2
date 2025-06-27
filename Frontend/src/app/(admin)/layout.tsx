"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import AccessDenied from "@/components/AccessDenied";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const userRole = session?.user?.role;

    if (status === "unauthenticated") {
      router.push("/signin");
    }

    // Opcional: redirigir luego de mostrar el mensaje si no es admin
    if (userRole && userRole !== "Administrador") {
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid" />
        <span className="ml-4 text-lg font-medium">Cargando sesión...</span>
      </div>
    );
  }

  if (session?.user?.role !== "Administrador") {
    // Muestra el componente AccessDenied mientras redirige
    return <AccessDenied message="Esta sección es solo para administradores. Serás redirigido en unos segundos." />;
  }

  // Sidebar dynamic class
  const isExpanded = false; // ajusta según tu lógica real
  const isHovered = false;
  const isMobileOpen = false;

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <AppSidebar />
        <Backdrop />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
          <AppHeader />
          <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
