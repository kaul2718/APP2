'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface RolData {
  id: number;
  slug: string;
  nombre: string;
  descripcion?: string;
}

export function useRoles() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<RolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roles`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setRoles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar roles");
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchRoles();
    }
  }, [session?.accessToken]);

  // Función para obtener el nombre de un rol por slug
  const getRoleName = (slug: string): string => {
    const rol = roles.find(r => r.slug === slug);
    return rol?.nombre || slug;
  };

  // Función para obtener el ID de un rol por slug
  const getRolId = (slug: string): number | null => {
    const rol = roles.find(r => r.slug === slug);
    return rol?.id || null;
  };

  return {
    roles,
    loading,
    error,
    getRoleName,
    getRolId,
  };
}
