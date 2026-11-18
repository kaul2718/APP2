"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface ProfileData {
  role: string;
  roles?: string[];
  permissions: string[];
  habilitadoTecnico?: boolean;
}

export function usePermissions() {
  const { data: session, status } = useSession();
  const [realtimeData, setRealtimeData] = useState<ProfileData | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(false);

  const staticRole = session?.user?.role || null;
  const staticRoles =
    Array.isArray(session?.user?.roles) && session.user.roles.length > 0
      ? session.user.roles
      : staticRole
        ? [staticRole]
        : [];
  const staticPermissions = session?.user?.permissions || [];
  const staticHabilitadoTecnico = Boolean(session?.user?.habilitadoTecnico);
  const accessToken = session?.accessToken || null;
  const isExpired = (session as any)?.error === 'AccessTokenExpired';

  useEffect(() => {
    if (!accessToken || isExpired) {
      setRealtimeData(null);
      return;
    }

    let isMounted = true;
    const fetchLatestPermissions = async () => {
      try {
        setRealtimeLoading(true);
        const data = await apiRequest<ProfileData>('/auth/profile', {}, session);
        if (isMounted && data) {
          setRealtimeData({
            role: data.role,
            roles:
              Array.isArray(data.roles) && data.roles.length > 0
                ? data.roles
                : data.role
                  ? [data.role]
                  : [],
            permissions: data.permissions || [],
            habilitadoTecnico: Boolean(data.habilitadoTecnico),
          });
        }
      } catch (error: any) {
        if (error?.isAuthError || error?.status === 401) {
          // Gestionado centralmente por authErrorHandler
          return;
        }
        console.error("Error fetching latest permissions:", error);
      } finally {
        if (isMounted) {
          setRealtimeLoading(false);
        }
      }
    };

    fetchLatestPermissions();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isExpired]);

  const activeRole = realtimeData ? realtimeData.role : staticRole;
  const activeRoles = realtimeData?.roles ?? staticRoles;
  const activePermissions = realtimeData ? realtimeData.permissions : staticPermissions;
  const habilitadoTecnico = realtimeData
    ? Boolean(realtimeData.habilitadoTecnico)
    : staticHabilitadoTecnico;
  const loading = status === "loading";

  const hasRole = (roleSlug: string) => activeRoles.includes(roleSlug);
  const hasAnyRole = (roleSlugs: string[]) => roleSlugs.some((r) => activeRoles.includes(r));
  const isAdmin = hasRole("admin");
  const isTech = hasRole("tech");
  const isRecep = hasRole("recep");
  const isClient = hasRole("client") || hasRole("cliente");
  const isOperationalStaff = hasAnyRole(["admin", "tech", "recep"]);

  const hasPermission = (permission: string) => {
    if (isAdmin) return true; // El administrador siempre tiene acceso total
    return activePermissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]) => {
    if (isAdmin) return true;
    return perms.some(p => activePermissions.includes(p));
  };

  return {
    role: activeRole,
    roles: activeRoles,
    permissions: activePermissions,
    habilitadoTecnico,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isTech,
    isRecep,
    isClient,
    isOperationalStaff,
    loading: loading,
    realtimeLoading,
  };
}
