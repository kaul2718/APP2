// src/hooks/useUserData.ts
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export interface UserProfileData {
  nombre: string;
  correo: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  rol: string;
  avatar?: string;
}

export function useUserData() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfileData | null>(null);

  useEffect(() => {
    const sessionUser = (session?.user as any)?.user;
    if (sessionUser) {
      const { nombre, correo, ciudad, direccion, telefono, role: rol } = sessionUser;
      setUser({
        nombre,
        correo,
        ciudad,
        direccion,
        telefono,
        rol,
        avatar: "/images/user/owner.jpg", // Puedes reemplazar con lógica futura de avatar
      });
    }
  }, [session]);

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
  };
}
