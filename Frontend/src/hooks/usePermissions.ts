"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface ProfileData {
  role: string;
  permissions: string[];
}

export function usePermissions() {
  const { data: session, status } = useSession();
  const [realtimeData, setRealtimeData] = useState<ProfileData | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(false);

  const staticRole = session?.user?.role || null;
  const staticPermissions = session?.user?.permissions || [];
  const accessToken = session?.accessToken || null;

  useEffect(() => {
    if (!accessToken) {
      setRealtimeData(null);
      return;
    }

    let isMounted = true;
    const fetchLatestPermissions = async () => {
      try {
        setRealtimeLoading(true);
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`;
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setRealtimeData({
              role: data.role,
              permissions: data.permissions || [],
            });
          }
        }
      } catch (error) {
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
  }, [accessToken]);

  const activeRole = realtimeData ? realtimeData.role : staticRole;
  const activePermissions = realtimeData ? realtimeData.permissions : staticPermissions;
  const loading = status === "loading";

  const hasPermission = (permission: string) => {
    if (activeRole === "admin") return true; // El administrador siempre tiene acceso total
    return activePermissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]) => {
    if (activeRole === "admin") return true;
    return perms.some(p => activePermissions.includes(p));
  };

  return {
    role: activeRole,
    permissions: activePermissions,
    hasPermission,
    hasAnyPermission,
    isAdmin: activeRole === "admin",
    loading: loading,
    realtimeLoading,
  };
}
