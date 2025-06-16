import { Role } from "src/common/enums/rol.enum";

export interface JwtPayload {
    sub: string; // ID del usuario
    role: Role;  // Rol del usuario
    // Agrega otras propiedades que estés incluyendo en el payload
  }