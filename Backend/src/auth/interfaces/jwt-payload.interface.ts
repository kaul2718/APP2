/**
 * JWT Payload Interface
 * 
 * Nota: Los roles ahora se cargan desde BD via UserRole.
 * El JWT solo contiene el ID del usuario.
 */
export interface JwtPayload {
  sub: string; // ID del usuario
  iat?: number; // Issued at
  exp?: number; // Expires at
}