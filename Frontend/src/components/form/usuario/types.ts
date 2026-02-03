export interface UsuarioFormData {
    cedula: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    role: number;
    password?: string;
    confirmPassword?: string;
    id?: string | number;
    estado?: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

export interface UsuarioFormErrors {
    [key: string]: string | undefined;
}

export type UsuarioFormMode = "create" | "edit";
