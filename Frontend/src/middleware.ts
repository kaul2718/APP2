import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    // Si el token está marcado como expirado, forzar redirección a /signin con callbackUrl
    if (token?.error === "AccessTokenExpired" || !token?.accessToken) {
      const signInUrl = new URL("/signin", req.url);
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
      signInUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Rutas públicas siempre autorizadas sin token
        if (
          path.startsWith("/consulta") ||
          path.startsWith("/signin") ||
          path.startsWith("/activar-cuenta")
        ) {
          return true;
        }

        // Para rutas protegidas, verificar existencia y no-expiración del token
        if (token?.error === "AccessTokenExpired" || !token?.accessToken) {
          return false;
        }

        return true;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/reportes/:path*",
    "/items/:path*",
    "/profile/:path*",
    "/calendar/:path*",
    "/ver-:path*",
    "/ver-:slug/:path*",
    "/ingresar-:path*",
    "/ingresar-:slug/:path*",
    "/blank/:path*",
    "/form-elements/:path*",
    "/basic-tables/:path*",
    "/bar-chart/:path*",
    "/line-chart/:path*",
    "/alerts/:path*",
    "/avatars/:path*",
    "/badge/:path*",
    "/buttons/:path*",
    "/images",
    "/modals/:path*",
    "/videos/:path*",
  ],
};
