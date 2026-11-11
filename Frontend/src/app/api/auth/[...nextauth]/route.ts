import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Decodifica de forma segura el payload del JWT para extraer el timestamp real de expiración (exp)
 */
function decodeJwtExp(tokenStr?: string): number | null {
  if (!tokenStr || typeof tokenStr !== "string") return null;
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identificador: { label: "Cédula o correo", type: "text" },
        correo: { label: "email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identificador = (credentials?.identificador || credentials?.correo || "").trim();
        const backendBaseUrl =
          process.env.INTERNAL_BACKEND_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "http://localhost:3000/api/v1";
        const res = await fetch(
          `${backendBaseUrl}/auth/login`,
          {
            method: "POST",
            body: JSON.stringify({
              identificador,
              correo: identificador,
              password: credentials?.password,
            }),
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await res.json();
        if (!res.ok || data.error || data.statusCode >= 400) {
          const mensaje = Array.isArray(data.message)
            ? data.message.join('. ')
            : data.message || "Credenciales inválidas o cuenta no activada.";
          throw new Error(mensaje);
        }

        return data;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas máximo de sesión (alineado con NestJS)
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.token; // Guarda el token JWT del backend
        token.user = user.user; // Guarda el objeto usuario con datos claros

        // Extraer la expiración real (exp) del JWT de NestJS
        const exp = decodeJwtExp(user.token);
        if (exp) {
          token.accessTokenExpires = exp * 1000;
        } else {
          token.accessTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        }
      }

      // Verificación estricta de expiración real: si exp ya pasó, marcar token como expirado
      if (token.accessTokenExpires && Date.now() >= token.accessTokenExpires) {
        token.error = "AccessTokenExpired";
        token.accessToken = undefined;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token.error === "AccessTokenExpired" || !token.accessToken) {
        session.error = "AccessTokenExpired";
        session.accessToken = undefined;
      } else {
        session.accessToken = token.accessToken;
      }

      session.user = token.user;
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
});

export { handler as GET, handler as POST };
