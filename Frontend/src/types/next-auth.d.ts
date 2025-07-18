import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        user: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            // añade más campos si los tienes
            role?: string;
            id?: number;
        };
    }
}
