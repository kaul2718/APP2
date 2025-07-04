import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Cliente } from "@/hooks/useClientes";

interface UseEditarUsuarioReturn {
  editando: Cliente | null;
  setEditando: React.Dispatch<React.SetStateAction<Cliente | null>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  actualizarUsuario: (cambiosExtra?: Partial<Cliente>) => Promise<Cliente | null>;
  cargando: boolean;
  resetearEdicion: () => void;
  toggleEstado: () => Promise<boolean>;
}

export default function useEditarUsuario(
  inicial: Cliente | null,
  token: string | null
): UseEditarUsuarioReturn {
  const [editando, setEditando] = useState<Cliente | null>(inicial);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setEditando(inicial ? { ...inicial } : null);
  }, [inicial]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditando(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const resetearEdicion = () => {
    setEditando(inicial ? { ...inicial } : null);
  };

  const validarCampos = (): boolean => {
    if (!editando) return false;

    if (!editando.nombre?.trim()) {
      toast.error("El nombre es obligatorio");
      return false;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(editando.nombre)) {
      toast.error("El nombre solo debe contener letras y espacios");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editando.correo)) {
      toast.error("Correo electrónico no válido");
      return false;
    }

    if (editando.telefono && !/^[0-9\s]+$/.test(editando.telefono)) {
      toast.error("El teléfono solo debe contener números");
      return false;
    }

    return true;
  };

  const actualizarUsuario = async (cambiosExtra: Partial<Cliente> = {}): Promise<Cliente | null> => {
    if (!editando || !token) {
      toast.error("No hay datos o sesión válida");
      return null;
    }

    if (!validarCampos()) {
      return null;
    }

    try {
      setCargando(true);
      const { id, deletedAt, estado, ...dataLimpia } = editando;
      const payload = { ...dataLimpia, ...cambiosExtra };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}`);
      }

      const actualizado: Cliente = await response.json();
      setEditando(actualizado);
      toast.success("Cliente actualizado con éxito");
      return actualizado;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar cliente");
      return null;
    } finally {
      setCargando(false);
    }
  };

  const toggleEstado = async (): Promise<boolean> => {
    if (!editando || !token) {
      toast.error("Faltan datos o autenticación");
      return false;
    }

    try {
      setCargando(true);
      const nuevoEstado = !editando.estado;
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${editando.id}/toggle-estado`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}`);
      }

      const actualizado: Cliente = await response.json();
      setEditando(actualizado);
      toast.success(`Usuario ${nuevoEstado ? "activado" : "deshabilitado"} correctamente`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
      return false;
    } finally {
      setCargando(false);
    }
  };

  return {
    editando,
    setEditando,
    handleInputChange,
    actualizarUsuario,
    cargando,
    resetearEdicion,
    toggleEstado,
  };
}
