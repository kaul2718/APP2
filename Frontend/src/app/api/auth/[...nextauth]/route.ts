import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.token; // Guarda el token JWT del backend
        token.user = user.user; // Guarda el objeto usuario con datos claros
      }

      return token;
    },
    async session({ session, token }: any) {
      session.user = token.user; // Session solo tiene los datos usuario limpios
      session.accessToken = token.accessToken; // Exponer accessToken en sesión
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
});

export { handler as GET, handler as POST };