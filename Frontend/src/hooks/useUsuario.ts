'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Role } from "@/types/role";

export interface Usuario {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  role: Role;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedUsuarioResponse {
  items: Usuario[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface UseUsuarioReturn {
  usuarios: Usuario[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  searchTerm: string;
  showInactive: boolean;
  fetchUsuarios: (
    page?: number,
    limit?: number,
    search?: string,
    includeInactive?: boolean
  ) => Promise<void>;
  refetch: () => Promise<void>;
  createUsuario: (usuarioData: {
    cedula: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    password: string;
    role?: Role;
  }) => Promise<Usuario>;
  updateUsuario: (id: number, usuarioData: {
    cedula?: string;
    nombre?: string;
    apellido?: string;
    correo?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    password?: string;
    role?: Role;
    estado?: boolean;
  }) => Promise<Usuario>;
  toggleUsuarioStatus: (id: number) => Promise<Usuario>;
  deleteUsuario: (id: number) => Promise<boolean>;
  restoreUsuario: (id: number) => Promise<boolean>;
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setShowInactive: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useUsuario(): UseUsuarioReturn {
  const { data: session, status } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchUsuarios = async (
    page: number = 1,
    limit: number = 10000,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (includeInactive) {
        url += `&includeInactive=true`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedUsuarioResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setUsuarios(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar usuarios");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  // Función refetch para actualizar los datos
  const refetch = async () => {
    await fetchUsuarios(currentPage, 10000, searchTerm, showInactive);
  };

  const createUsuario = async (usuarioData: {
    cedula: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    password: string;
    role?: Role;
  }): Promise<Usuario> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(usuarioData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newUsuario = await response.json();
      toast.success("Usuario creado exitosamente");
      await refetch(); // Actualizamos la lista de usuarios
      return newUsuario;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear usuario");
      throw error;
    }
  };

  const updateUsuario = async (
    id: number,
    usuarioData: {
      cedula?: string;
      nombre?: string;
      apellido?: string;
      correo?: string;
      telefono?: string;
      direccion?: string;
      ciudad?: string;
      password?: string;
      role?: Role;
      estado?: boolean;
    }
  ): Promise<Usuario> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(usuarioData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedUsuario = await response.json();
      toast.success("Usuario actualizado exitosamente");
      await refetch();
      return updatedUsuario;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar usuario");
      throw error;
    }
  };

  const toggleUsuarioStatus = async (id: number): Promise<Usuario> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedUsuario = await response.json();
      toast.success(`Usuario ${updatedUsuario.estado ? 'activado' : 'desactivado'} exitosamente`);
      await refetch();
      return updatedUsuario;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del usuario");
      throw error;
    }
  };

  const deleteUsuario = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      toast.success("Usuario eliminado exitosamente");
      await refetch();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar usuario");
      throw error;
    }
  };

  const restoreUsuario = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      toast.success("Usuario restaurado exitosamente");
      await refetch();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restaurar usuario");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsuarios(1, 10000, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    usuarios,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchUsuarios,
    refetch, // Añadimos la función refetch
    createUsuario,
    updateUsuario,
    toggleUsuarioStatus,
    deleteUsuario,
    restoreUsuario,
    setUsuarios,
    setSearchTerm,
    setShowInactive,
  };
}