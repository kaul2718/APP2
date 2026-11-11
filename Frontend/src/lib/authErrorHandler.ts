'use client';

import { signOut } from 'next-auth/react';
import { toast } from 'react-toastify';

/**
 * Gestor centralizado de eventos de autenticación (401) y permisos (403)
 * Garantiza que cuando múltiples peticiones concurrentes fallen por sesión expirada,
 * se ejecute una única notificación, una única llamada a signOut y una única redirección.
 */
class AuthErrorHandler {
  private isHandling401 = false;
  private last401Timestamp = 0;
  private readonly LOCK_TIMEOUT_MS = 5000;

  /**
   * Rutas públicas donde una falla de autenticación no debe provocar redirección forzada
   */
  private readonly PUBLIC_PATHS = ['/signin', '/consulta', '/activar-cuenta'];

  /**
   * Verifica si la ruta actual es pública
   */
  public isPublicPath(path?: string): boolean {
    const targetPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    return this.PUBLIC_PATHS.some((pub) => targetPath.startsWith(pub));
  }

  /**
   * Manejador centralizado para HTTP 401 Unauthorized
   * Se ejecuta una sola vez para múltiples llamadas concurrentes.
   */
  public async handleUnauthorized(options?: {
    customMessage?: string;
    skipRedirect?: boolean;
  }): Promise<void> {
    const now = Date.now();

    // Bloqueo de concurrencia: si ya se está procesando un 401 en los últimos 5 segundos, ignorar llamadas repetidas
    if (this.isHandling401 || now - this.last401Timestamp < this.LOCK_TIMEOUT_MS) {
      return;
    }

    this.isHandling401 = true;
    this.last401Timestamp = now;

    try {
      // 1. Emitir evento para que formularios activos puedan resguardar borradores no sensibles
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hc:session-expired'));
      }

      // 2. Notificación deduplicada única mediante toastId
      toast.error(
        options?.customMessage || 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.',
        {
          toastId: 'auth-session-expired',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        },
      );

      // Si estamos en entorno servidor o se solicita omitir redirección, salir
      if (typeof window === 'undefined' || options?.skipRedirect) {
        return;
      }

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      // Si ya está en una ruta pública (como /signin o /consulta), no forzar redirección
      if (this.isPublicPath(currentPath)) {
        return;
      }

      // 3. Capturar callbackUrl segura para retorno tras inicio de sesión
      const callbackUrl = `${currentPath}${currentSearch}`;

      // 4. Invalidar sesión en NextAuth (sin redirección automática del SDK)
      try {
        await signOut({ redirect: false });
      } catch (signOutError) {
        console.warn('Advertencia al invalidar sesión NextAuth:', signOutError);
      }

      // 5. Redirección limpia conservando el destino solicitado
      setTimeout(() => {
        const targetUrl = `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        window.location.href = targetUrl;
      }, 350);
    } finally {
      // Liberar el cerrojo tras la ventana de deduplicación
      setTimeout(() => {
        this.isHandling401 = false;
      }, this.LOCK_TIMEOUT_MS);
    }
  }

  /**
   * Manejador centralizado para HTTP 403 Forbidden
   * Informa al usuario que carece de permisos SIN cerrar su sesión ni redirigirlo.
   */
  public handleForbidden(options?: { customMessage?: string }): void {
    toast.warn(
      options?.customMessage || 'No tienes permisos suficientes para realizar esta acción.',
      {
        toastId: 'auth-forbidden',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      },
    );
  }
}

export const authErrorHandler = new AuthErrorHandler();
