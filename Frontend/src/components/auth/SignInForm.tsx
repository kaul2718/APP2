"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

export default function SignInForm() {
  const {
    showPassword,
    toggleShowPassword,
    identificador,
    password,
    errors,
    loading,
    handleIdentificadorChange,
    handlePasswordChange,
    handleSubmit,
  } = useLogin();

  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu cédula o correo electrónico y tu contraseña para acceder al sistema
            </p>
          </div>
          <div>
            {/* FORMULARIO */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="identificador">
                    Cédula o correo electrónico <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="identificador"
                    type="text"
                    placeholder="1712345678 o usuario@correo.com"
                    value={identificador}
                    onChange={handleIdentificadorChange}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                    />
                    <span
                      onClick={toggleShowPassword}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      role="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Mantener sesión iniciada
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={loading}>
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Mostrar errores */}
            {errors.length > 0 && (
              <div className="mt-5 p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400 text-sm flex items-start gap-2.5">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <ul className="space-y-1">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿Dejaste un equipo y quieres consultar el estado?{" "}
                <Link
                  href="/consulta"
                  className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Consultar orden con QR / Cédula
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
