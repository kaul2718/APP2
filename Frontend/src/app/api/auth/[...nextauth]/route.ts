import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        correo: { label: "email", type: "email", placeholder: "kaul@gmail.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
          {
            method: "POST",
            body: JSON.stringify({
              correo: credentials?.correo,
              password: credentials?.password,
            }),
            headers: { "Content-Type": "application/json" },
          }
        );
        const user = await res.json();
        if (user.error) throw user;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;      // Guarda el token JWT del backend
        token.user = user.user;              // Guarda el objeto usuario con datos claros
      }

      return token;
    },
    async session({ session, token }) {
      console.log("session token:", token);

      session.user = token.user;             // Session solo tiene los datos usuario limpios
      session.accessToken = token.accessToken;  // También puedes exponer el accessToken en la sesión
      return session;
    },
  },

  pages: {
    signIn: "/signin", // ✅ coincidir con tu ruta real
  },
});

export { handler as GET, handler as POST };