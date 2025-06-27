"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSignUpFormHandler } from "@/hooks/useSignUpFormHandler";

export default function SignUpForm() {
  const {
    formData,
    showPassword,
    isChecked,
    setShowPassword,
    setIsChecked,
    handleChange,
    handleSubmit,
    errors,
    isSubmitting,
  } = useSignUpFormHandler();

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Registrarse
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ingresa tu información para crear una cuenta
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Cédula*</Label>
                <Input type="text" name="cedula" value={formData.cedula} onChange={handleChange} />
              </div>
              <div>
                <Label>Nombre*</Label>
                <Input type="text" name="nombre" value={formData.nombre} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Teléfono*</Label>
                <Input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
              </div>
              <div>
                <Label>Ciudad*</Label>
                <Input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label>Dirección*</Label>
              <Input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>

            <div>
              <Label>Correo electrónico*</Label>
              <Input type="email" name="correo" value={formData.correo} onChange={handleChange} />
            </div>

            <div>
              <Label>Contraseña*</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <Label>Confirmar contraseña*</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox className="w-5 h-5" checked={isChecked} onChange={setIsChecked} />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Acepto los{" "}
                <span className="text-gray-800 dark:text-white">Términos</span> y{" "}
                <span className="text-gray-800 dark:text-white">Política de privacidad</span>
              </p>
            </div>

            {errors.length > 0 &&
              errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600">
                  {err}
                </p>
              ))}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition disabled:opacity-50"
              >
                {isSubmitting ? "Registrando..." : "Registrarse"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-700 dark:text-gray-400">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600">
            Iniciar sesión
          </Link>
        </div>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
}