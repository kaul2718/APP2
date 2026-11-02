"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

interface Usuario {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  deletedAt?: string; // por si viene del backend
  role?: string;
  fotoPerfilUrl?: string | null;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useUserProfile() {
  const { data: session, status: sessionStatus } = useSession();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const obtenerDatosUsuario = useCallback(async () => {
    try {
      setError(null);
      setCargando(true);

      if (sessionStatus === "loading") return;

      if (sessionStatus === "unauthenticated" || !session?.user) {
        setCargando(false);
        return;
      }

      const userId = session.user.id;
      const userToken = session.accessToken;

      if (!userId || !userToken) {
        throw new Error("Datos de autenticación incompletos");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      const userData: Usuario = await response.json();

      if (!userData || typeof userData !== "object" || !userData.id) {
        throw new Error("Datos de usuario no válidos");
      }

      setUsuario(userData);
      setEditando(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setCargando(false);
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    obtenerDatosUsuario();

    const handleProfileUpdate = () => {
      obtenerDatosUsuario();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user-profile-updated", handleProfileUpdate);
      return () => {
        window.removeEventListener("user-profile-updated", handleProfileUpdate);
      };
    }
  }, [obtenerDatosUsuario]);

  const actualizarAvatar = async (file: File): Promise<string | null> => {
    if (!session?.user?.id || !session.accessToken) {
      toast.error("No hay sesión activa");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${session.user.id}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Error al subir foto de perfil");
      }

      const data = await response.json();
      const newUrl = data.fotoPerfilUrl;

      setUsuario((prev) => (prev ? { ...prev, fotoPerfilUrl: newUrl } : null));
      setEditando((prev) => (prev ? { ...prev, fotoPerfilUrl: newUrl } : null));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-profile-updated"));
      }

      toast.success("Foto de perfil actualizada con éxito ✅");
      return newUrl;
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar la foto");
      return null;
    }
  };

  const eliminarAvatar = async (): Promise<boolean> => {
    if (!session?.user?.id || !session.accessToken) return false;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${session.user.id}/avatar`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Error al eliminar foto");

      setUsuario((prev) => (prev ? { ...prev, fotoPerfilUrl: null } : null));
      setEditando((prev) => (prev ? { ...prev, fotoPerfilUrl: null } : null));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-profile-updated"));
      }

      toast.success("Foto de perfil eliminada ✅");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la foto");
      return false;
    }
  };

  const actualizarPerfil = async (): Promise<boolean> => {
    if (!editando) {
      toast.warning("No hay datos para actualizar");
      return false;
    }

    if (!session?.user?.id || !session.accessToken) {
      toast.error("No hay sesión activa");
      return false;
    }

    // Validaciones de campos obligatorios
    if (!editando.nombre?.trim() || !editando.correo?.trim() || !editando.apellido?.trim()) {
      toast.error("Nombre, apellido y correo son campos obligatorios");
      return false;
    }
    

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editando.correo)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return false;
    }

    try {
      setCargando(true);

      // Guardar copia del estado anterior para posible rollback
      const backupUsuario = usuario;
      const backupEditando = editando;

      // Actualización optimista respetando fotoPerfilUrl
      setUsuario(prev => ({
        ...prev,
        ...editando,
        fotoPerfilUrl: prev?.fotoPerfilUrl ?? editando.fotoPerfilUrl ?? null,
      }));
      setEditando(prev => ({
        ...prev,
        ...editando,
        fotoPerfilUrl: prev?.fotoPerfilUrl ?? editando.fotoPerfilUrl ?? null,
      }));

      const datosPermitidos = {
        nombre: editando.nombre,
        apellido: editando.apellido,
        correo: editando.correo,
        telefono: editando.telefono,
        direccion: editando.direccion,
        ciudad: editando.ciudad
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${session.user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(datosPermitidos),
        }
      );

      if (!response.ok) {
        // Si falla, revertir al estado anterior
        setUsuario(backupUsuario);
        setEditando(backupEditando);

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      const updatedUser: Usuario = await response.json();

      // Sincronizar con la respuesta del servidor respetando fotoPerfilUrl
      setUsuario(prev => ({
        ...prev,
        ...updatedUser,
        fotoPerfilUrl: updatedUser.fotoPerfilUrl ?? prev?.fotoPerfilUrl ?? null,
      }));
      setEditando(prev => ({
        ...prev,
        ...updatedUser,
        fotoPerfilUrl: updatedUser.fotoPerfilUrl ?? prev?.fotoPerfilUrl ?? null,
      }));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-profile-updated"));
      }

      toast.success("Perfil actualizado con éxito ✅");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      //console.error("Error al actualizar perfil:", errorMessage);
      setError(errorMessage);
      toast.error(`Error al actualizar perfil: ${errorMessage}`);
      return false;
    } finally {
      setCargando(false);
    }
  };


  const cambiarContrasena = async (): Promise<boolean> => {
    if (!session?.user?.id || !session.accessToken) {
      toast.error("No hay sesión activa");
      return false;
    }

    // Validaciones
    if (!passwordData.currentPassword) {
      toast.error("Debes ingresar tu contraseña actual");
      return false;
    }

    if (!passwordData.newPassword) {
      toast.error("Debes ingresar una nueva contraseña");
      return false;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return false;
    }

    try {
      setCargando(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${session.user.id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Limpiar el formulario de contraseña
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success("Contraseña actualizada con éxito ✅");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      //console.error("Error al cambiar contraseña:", errorMessage);
      setError(errorMessage);
      toast.error(`Error al cambiar contraseña: ${errorMessage}`);
      return false;
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editando) return;

    setEditando({
      ...editando,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const resetearEdicion = () => {
    setEditando(usuario);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return {
    usuario,
    cargando,
    error,
    editando,
    passwordData,
    setEditando,
    actualizarPerfil,
    cambiarContrasena,
    handleInputChange,
    handlePasswordChange,
    resetearEdicion,
    actualizarAvatar,
    eliminarAvatar,
    refetch: obtenerDatosUsuario,
  };
}