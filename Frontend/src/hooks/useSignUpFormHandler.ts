// hooks/useSignUpFormHandler.ts
import { useState } from "react";
import { useRegister } from "./useSignUpForm";
import { toast } from "react-toastify";

export function useSignUpFormHandler() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    password: "",
    confirmPassword: "",
  });

  const { registerUser, errors, isSubmitting } = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

    if (!/^\d{10}$/.test(cedula)) {
      toast.error("La cédula debe tener exactamente 10 dígitos numéricos.");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      toast.error("Correo electrónico no válido.");
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
    await registerUser({ ...formData, role: "Cliente" });
  };

  return {
    formData,
    showPassword,
    isChecked,
    setShowPassword,
    setIsChecked,
    handleChange,
    handleSubmit,
    errors,
    isSubmitting,
  };
}
