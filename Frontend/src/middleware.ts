export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!api|_next/static|_next/image|images|favicon.ico|signin|signup|reset-password|establecer-password|consulta|$).*)",
  ],
};