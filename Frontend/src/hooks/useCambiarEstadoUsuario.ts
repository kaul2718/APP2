import { toast } from "react-toastify";

export interface Usuario {
  id: number;
  deletedAt?: string | null;
}

export async function cambiarEstadoUsuario(
  userId: number,
  activar: boolean,
  token: string
): Promise<Usuario | null> {
  const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}/${activar ? "restore" : "soft-delete"}`;

  try {
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    // Puede venir un 204 sin contenido o un JSON con el usuario actualizado
    let updated: Usuario;

    const text = await response.text();
    if (text) {
      updated = JSON.parse(text);
    } else {
      updated = {
        id: userId,
        deletedAt: activar ? null : new Date().toISOString(),
      };
    }

    toast.success(
      activar
        ? "Usuario activado correctamente ✅"
        : "Usuario deshabilitado correctamente ✅"
    );

    return updated;
  } catch (error: any) {
    toast.error(error?.message || "Error al cambiar el estado del usuario ❌");
    return null;
  }
}
