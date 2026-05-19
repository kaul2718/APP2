export type RegisterFormData = {
  cedula: string;
  nombre: string;
  apellido?: string;
  correo: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  password: string;
  confirmPassword?: string; // 👈 agregar esta línea
  role?: string; // si lo manejas fijo desde el frontend
  roleIds?: string[];
};
