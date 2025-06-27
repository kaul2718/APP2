"use client";

import { useSession } from "next-auth/react";

const TestPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Cargando sesión...</div>;
  }

  if (status === "unauthenticated") {
    return <div>No estás autenticado.</div>;
  }

  const user = session?.user;

  return (
    <div className="p-5">
      <h2 className="mb-4">Información del usuario autenticado:</h2>
      <ul className="list-group">
        <li className="list-group-item">📧 Correo: {user?.correo}</li>
        <li className="list-group-item">👤 Nombre: {user?.nombre}</li>
        <li className="list-group-item">📞 Teléfono: {user?.telefono}</li>
        <li className="list-group-item">📍 Ciudad: {user?.ciudad}</li>
        <li className="list-group-item">🛡️ Rol: {user?.role}</li>
      </ul>
    </div>
  );
};

export default TestPage;
