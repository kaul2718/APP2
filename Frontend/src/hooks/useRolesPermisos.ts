'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  createdAt?: string;
}

export interface RolePermissionEntry {
  id: number;
  permissionId: number;
  permission: Permission;
}

export interface Rol {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: string;
  rolePermissions: RolePermissionEntry[];
}

export interface CreateRolPayload {
  nombre: string;
  slug: string;
  descripcion?: string;
  permissionIds?: number[];
}

export interface UpdateRolPayload {
  nombre?: string;
  descripcion?: string;
}

export interface CreatePermissionPayload {
  nombre: string;
  slug: string;
  descripcion?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const SYSTEM_SLUGS = ['admin', 'tech', 'recep', 'client', 'user'];

export function useRolesPermisos() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [roles, setRoles] = useState<Rol[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // ── Fetch all ──────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roles`, { headers: headers() }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/permissions`, { headers: headers() }),
      ]);
      if (!rolesRes.ok) throw new Error("Error al cargar roles");
      if (!permsRes.ok) throw new Error("Error al cargar permisos");

      const [rolesData, permsData] = await Promise.all([rolesRes.json(), permsRes.json()]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Role CRUD ──────────────────────────────────────────────────────────────

  const createRol = async (payload: CreateRolPayload): Promise<Rol | null> => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roles`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al crear rol");
      }
      const newRol: Rol = await res.json();
      setRoles((prev) => [newRol, ...prev]);
      toast.success("Rol creado correctamente");
      return newRol;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear rol");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateRol = async (id: number, payload: UpdateRolPayload): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roles/${id}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al actualizar rol");
      }
      const updated: Rol = await res.json();
      setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      toast.success("Rol actualizado correctamente");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar rol");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteRol = async (id: number): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roles/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al eliminar rol");
      }
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rol eliminado correctamente");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar rol");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Permission CRUD ────────────────────────────────────────────────────────

  const createPermission = async (payload: CreatePermissionPayload): Promise<Permission | null> => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/permissions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al crear permiso");
      }
      const newPerm: Permission = await res.json();
      setPermissions((prev) => [newPerm, ...prev]);
      toast.success("Permiso creado correctamente");
      return newPerm;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear permiso");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deletePermission = async (id: number): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/permissions/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al eliminar permiso");
      }
      setPermissions((prev) => prev.filter((p) => p.id !== id));
      toast.success("Permiso eliminado correctamente");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar permiso");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Matrix: toggle single permission on a role ─────────────────────────────

  const togglePermission = async (roleId: number, permissionId: number): Promise<void> => {
    const rol = roles.find((r) => r.id === roleId);
    if (!rol) return;

    const hasIt = rol.rolePermissions.some((rp) => rp.permissionId === permissionId);
    const currentIds = rol.rolePermissions.map((rp) => rp.permissionId);
    const newIds = hasIt
      ? currentIds.filter((id) => id !== permissionId)
      : [...currentIds, permissionId];

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const perm = permissions.find((p) => p.id === permissionId);
        if (!perm) return r;
        const newRPs = hasIt
          ? r.rolePermissions.filter((rp) => rp.permissionId !== permissionId)
          : [
              ...r.rolePermissions,
              { id: Date.now(), permissionId, permission: perm },
            ];
        return { ...r, rolePermissions: newRPs };
      })
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/roles/${roleId}/permissions`,
        {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({ permissionIds: newIds }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Error al actualizar permisos");
      }
    } catch (e) {
      // Revert on failure
      toast.error(e instanceof Error ? e.message : "Error al actualizar permisos");
      fetchAll();
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const isSystemRole = (slug: string) => SYSTEM_SLUGS.includes(slug);

  const getRolePermissionIds = (roleId: number): number[] => {
    const rol = roles.find((r) => r.id === roleId);
    return rol?.rolePermissions.map((rp) => rp.permissionId) ?? [];
  };

  return {
    roles,
    permissions,
    loading,
    saving,
    error,
    fetchAll,
    // Role actions
    createRol,
    updateRol,
    deleteRol,
    // Permission actions
    createPermission,
    deletePermission,
    // Matrix
    togglePermission,
    getRolePermissionIds,
    isSystemRole,
    SYSTEM_SLUGS,
  };
}
