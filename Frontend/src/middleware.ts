export { default } from "next-auth/middleware";

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