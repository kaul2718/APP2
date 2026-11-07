"use client";

import React, { useState, useEffect, useRef } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  SparklesIcon,
  ArrowRightIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function ActivarCuentaComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState<string>(tokenFromUrl);
  const validatedRef = useRef(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [verificando, setVerificando] = useState(true);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [tokenMensaje, setTokenMensaje] = useState<string>("");
  const [clienteInfo, setClienteInfo] = useState<{
    nombre?: string;
    apellido?: string;
    cedula?: string;
    tipo?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // 1. Validar la credencial de activación al montar la vista (solo una vez)
  useEffect(() => {
    if (validatedRef.current) return;

    const tokenToValidate = token || searchParams.get("token") || "";

    if (!tokenToValidate) {
      setVerificando(false);
      setTokenValido(false);
      setTokenMensaje("No se proporcionó ninguna credencial de activación.");
      return;
    }

    validatedRef.current = true;
    setToken(tokenToValidate);

    const validar = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api/v1";
        const res = await fetch(`${baseUrl}/auth/activacion/validar/${encodeURIComponent(tokenToValidate)}`);
        const data = await res.json();

        if (res.ok && data.valido) {
          setTokenValido(true);
          setClienteInfo({
            ...data.cliente,
            tipo: data.tipo,
          });
        } else {
          setTokenValido(false);
          setTokenMensaje(data.mensaje || "La credencial de activación no es válida o ha expirado.");
        }
      } catch (err) {
        setTokenValido(false);
        setTokenMensaje("No se pudo conectar con el servidor de autenticación.");
      } finally {
        setVerificando(false);
      }
    };

    validar();
  }, []);

  // Reglas de validación
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSubmit(null);

    if (!token) {
      setErrorSubmit("Credencial de activación no disponible. Por favor, escanea el código QR nuevamente.");
      return;
    }

    if (!isFormValid) {
      setErrorSubmit("Verifica que la contraseña cumpla con todos los requisitos de seguridad.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api/v1";
      const res = await fetch(`${baseUrl}/auth/activacion/consumir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al activar la cuenta.");
      }

      setExito(true);
      // Limpiar el parámetro token de la URL después de consumir el secreto
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      toast.success(
        clienteInfo?.tipo === "RECUPERACION_PRESENCIAL"
          ? "¡Contraseña actualizada con éxito! Ya puedes iniciar sesión."
          : "¡Cuenta activada con éxito! Ya puedes iniciar sesión."
      );
    } catch (err: any) {
      setErrorSubmit(err.message || "Ocurrió un error al procesar la solicitud.");
      toast.error(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // Estado 1: Verificando token
  if (verificando) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full p-6 sm:p-12 items-center justify-center">
        <div className="w-full max-w-md mx-auto text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 animate-pulse">
            <KeyIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Verificando credencial de activación...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Validando la firma criptográfica temporal de tu solicitud presencial.
          </p>
        </div>
      </div>
    );
  }

  // Estado 2: Token inválido, expirado, consumido o no provisto
  if (!tokenValido && !exito) {
    const isSinToken = !token || tokenMensaje.includes("No se proporcionó");
    const isUtilizada = tokenMensaje.toLowerCase().includes("utilizada");
    const isExpirada = tokenMensaje.toLowerCase().includes("expirad");
    const isRevocada = tokenMensaje.toLowerCase().includes("cancelada") || tokenMensaje.toLowerCase().includes("sustituida");

    let tituloEstado = "Credencial no válida";
    let descEstado = tokenMensaje || "La credencial de activación no es válida o ha caducado.";
    let ayudaEstado = "Por motivos de seguridad, los códigos QR y enlaces de activación se emiten de forma segura en Hospital del Computador.";

    if (isSinToken) {
      tituloEstado = "Enlace de activación requerido";
      descEstado = "Para activar tu cuenta y configurar tu contraseña personal se requiere el enlace único o código QR generado en recepción al ingresar tu equipo.";
      ayudaEstado = "Si acabas de registrar un equipo, solicita en recepción escanear el código QR del mostrador o recibir el enlace directo por WhatsApp.";
    } else if (isUtilizada) {
      tituloEstado = "Esta invitación ya fue utilizada";
      descEstado = "La contraseña personal para esta cuenta ya fue establecida previamente. No es necesario volver a activar tu cuenta.";
      ayudaEstado = "Ya puedes ingresar directamente con tu número de cédula y tu contraseña personal para consultar tus órdenes y autorizar presupuestos.";
    } else if (isExpirada) {
      tituloEstado = "Invitación de activación expirada";
      descEstado = "Por seguridad, las invitaciones de activación tienen una vigencia de 48 horas y esta credencial ha concluido su plazo.";
      ayudaEstado = "Puedes acercarte a recepción o contactar a soporte para que emitan una nueva invitación de activación a tu número de cédula.";
    } else if (isRevocada) {
      tituloEstado = "Invitación sustituida o revocada";
      descEstado = "Esta invitación fue cancelada debido a que se emitió un nuevo código QR o enlace más reciente para tu cuenta.";
      ayudaEstado = "Por favor abre el código QR o enlace más reciente que recibiste de recepción.";
    }

    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full p-6 sm:p-12 justify-center">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className={`p-5 rounded-2xl border text-center space-y-3 ${
            isUtilizada
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}>
            <div className={`inline-flex p-2.5 rounded-full ${
              isUtilizada
                ? "bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400"
                : "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400"
            }`}>
              <ExclamationCircleIcon className="w-8 h-8" />
            </div>
            <h2 className={`text-lg font-bold ${
              isUtilizada
                ? "text-amber-800 dark:text-amber-300"
                : "text-red-700 dark:text-red-400"
            }`}>
              {tituloEstado}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {descEstado}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              ¿Qué debes hacer?
            </p>
            <p className="leading-relaxed">
              {ayudaEstado}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/signin"
              className="w-full py-2.5 px-4 text-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-colors shadow-sm"
            >
              {isUtilizada ? "Iniciar Sesión con mi Cédula" : "Ir a Iniciar Sesión"}
            </Link>
            <Link
              href="/consulta"
              className="w-full py-2.5 px-4 text-center rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
            >
              Consultar orden con cédula / QR de ODS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado 3: Activación completada con éxito
  if (exito) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full p-6 sm:p-12 justify-center">
        <div className="w-full max-w-md mx-auto space-y-6 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-bounce">
            <CheckCircleIcon className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {clienteInfo?.tipo === "RECUPERACION_PRESENCIAL"
                ? "¡Contraseña restablecida con éxito!"
                : "¡Tu cuenta ha sido activada!"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu contraseña fue guardada de manera segura. A partir de ahora podrás acceder al portal de clientes utilizando tu número de cédula y tu contraseña.
            </p>
          </div>

          {clienteInfo && (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-left space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Datos de acceso
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {clienteInfo.nombre} {clienteInfo.apellido}
              </p>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-mono">
                Cédula: {clienteInfo.cedula}
              </p>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/signin"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <span>Iniciar sesión ahora</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const esRecuperacion = clienteInfo?.tipo === "RECUPERACION_PRESENCIAL";

  // Estado 4: Formulario principal de establecimiento de contraseña
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full p-6 sm:p-12 justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-3 border border-brand-200 dark:border-brand-800">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>
              {esRecuperacion
                ? "Restablecimiento Presencial Verificado"
                : "Activación Presencial Verificada"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {esRecuperacion ? "Restablece tu contraseña" : "Activa tu cuenta"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {esRecuperacion
              ? "Crea una nueva contraseña para acceder a tus órdenes en Hospital del Computador."
              : "Crea una contraseña para consultar tus reparaciones en Hospital del Computador."}
          </p>
        </div>

        {/* Tarjeta de bienvenida personalizada */}
        {clienteInfo && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50/50 dark:from-brand-950/40 dark:to-gray-800 border border-brand-100 dark:border-brand-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {clienteInfo.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                Cliente verificado
              </p>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {clienteInfo.nombre} {clienteInfo.apellido}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                C.I. {clienteInfo.cedula}
              </p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="password">
              Nueva contraseña <span className="text-error-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-3.5 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeCloseIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              Confirmar contraseña <span className="text-error-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-3.5 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showConfirmPassword ? "Ocultar confirmación" : "Ver confirmación"}
              >
                {showConfirmPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeCloseIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Requisitos de seguridad interactivos */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 space-y-1.5 text-xs">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Requisitos de la contraseña:
            </p>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? "bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-transparent"}`}>✓</span>
              <span className={hasMinLength ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-gray-500 dark:text-gray-400"}>
                Al menos 8 caracteres
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasUpperCase ? "bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-transparent"}`}>✓</span>
              <span className={hasUpperCase ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-gray-500 dark:text-gray-400"}>
                Al menos una letra mayúscula
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasLowerCase ? "bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-transparent"}`}>✓</span>
              <span className={hasLowerCase ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-gray-500 dark:text-gray-400"}>
                Al menos una letra minúscula
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasNumber ? "bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-transparent"}`}>✓</span>
              <span className={hasNumber ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-gray-500 dark:text-gray-400"}>
                Al menos un número
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordsMatch ? "bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-transparent"}`}>✓</span>
              <span className={passwordsMatch ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-gray-500 dark:text-gray-400"}>
                Las contraseñas coinciden
              </span>
            </div>
          </div>

          {errorSubmit && (
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400 text-xs flex items-center gap-2">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{errorSubmit}</span>
            </div>
          )}

          <div>
            <Button
              className="w-full py-3"
              size="sm"
              type="submit"
              disabled={loading || !isFormValid}
            >
              {loading
                ? "Guardando contraseña..."
                : esRecuperacion
                ? "Restablecer mi contraseña"
                : "Activar mi cuenta"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/signin"
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ¿Ya tienes una contraseña? Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
