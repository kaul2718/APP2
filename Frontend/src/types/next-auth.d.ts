import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            nombre: string;
            email: string;
            token: string;
        };
    }
}