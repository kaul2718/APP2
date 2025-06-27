export type CustomLoginResponse = {
  token: string;
  user: {
    id: number;
    nombre: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    role: string;
  };
};
