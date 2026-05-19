// hooks/useSignUpFormHandler.ts
import { useState, useEffect, useCallback } from "react";
import { useRegister } from "./useSignUpForm";
import { toast } from "react-toastify";
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';

export function useSignUpFormHandler() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    password: "",
    confirmPassword: "",
  });

  const [buscandoSri, setBuscandoSri] = useState(false);
  const [mensajeSri, setMensajeSri] = useState<{ tipo: "exito" | "error" | "cargando"; texto: string } | null>(null);

  const { registerUser, errors: apiErrors, isSubmitting } = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const formatted = new AsYouType('EC').input(value);
      setFormData(prev => ({ ...prev, telefono: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const consultarDocumentoSri = useCallback(async (doc: string) => {
    if (!doc || (doc.length !== 10 && doc.length !== 13)) return;

    setBuscandoSri(true);
    setMensajeSri({ tipo: "cargando", texto: "⏳ Consultando Registro Civil / SRI..." });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sri/consultar/${doc}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se encontraron registros");
      }

      const data = await response.json();
      if (data && data.success) {
        setMensajeSri({ tipo: "exito", texto: "✅ Datos encontrados" });
        
        const partes = data.name.trim().split(/\s+/);
        let nombreResult = "";
        let apellidoResult = "";

        if (partes.length >= 4) {
          nombreResult = `${partes[2]} ${partes[3] || ""}`.trim();
          apellidoResult = `${partes[0]} ${partes[1]}`.trim();
        } else if (partes.length === 3) {
          nombreResult = partes[2];
          apellidoResult = `${partes[0]} ${partes[1]}`;
        } else if (partes.length === 2) {
          nombreResult = partes[1];
          apellidoResult = partes[0];
        } else {
          nombreResult = data.name;
          apellidoResult = ".";
        }

        setFormData(prev => ({
          ...prev,
          nombre: nombreResult,
          apellido: apellidoResult,
          direccion: data.address || prev.direccion,
          ciudad: data.city || prev.ciudad || "QUITO",
        }));
      } else {
        setMensajeSri({ tipo: "error", texto: "❌ No se encontró información" });
      }
    } catch (error) {
      setMensajeSri({ tipo: "error", texto: "❌ No se encontró información" });
    } finally {
      setBuscandoSri(false);
    }
  }, []);

  useEffect(() => {
    if (formData.cedula.length === 10 || formData.cedula.length === 13) {
      void consultarDocumentoSri(formData.cedula);
    } else {
      setMensajeSri(null);
    }
  }, [formData.cedula, consultarDocumentoSri]);

  const validate = () => {
    const {
      cedula,
      nombre,
      correo,
      telefono,
      direccion,
      ciudad,
      password,
      confirmPassword,
    } = formData;

    if (
      !cedula || !nombre || !correo || !telefono ||
      !direccion || !ciudad || !password || !confirmPassword
    ) {
      toast.error("Todos los campos son obligatorios.");
      return false;
    }

    if (cedula.length !== 10 && cedula.length !== 13) {
      toast.error("La identificación debe ser Cédula (10 dígitos) o RUC (13 dígitos).");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      toast.error("Correo electrónico no válido.");
      return false;
    }

    const parsedPhone = parsePhoneNumberFromString(telefono, 'EC');
    if (!parsedPhone || !parsedPhone.isValid()) {
      toast.error("Número de teléfono de Ecuador no válido (Celular o Fijo).");
      return false;
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpper || !hasLower || !hasNumber) {
      toast.error("La contraseña debe incluir mayúsculas, minúsculas y números.");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return false;
    }

    if (!isChecked) {
      toast.error("Debes aceptar los Términos y Condiciones.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    await registerUser({ ...formData, roleIds: ["client"] });
  };

  return {
    formData,
    showPassword,
    isChecked,
    setShowPassword,
    setIsChecked,
    handleChange,
    handleSubmit,
    errors: apiErrors,
    isSubmitting,
    buscandoSri,
    mensajeSri,
  };
}
