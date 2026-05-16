import { Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SessionAuthProvider from "@/context/SessionAuthProvider";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "Hospital del Computador - Gestión de Órdenes",
  description: "Sistema integral de gestión para servicio técnico",
  icons: {
    icon: "/images/logo/logo-icon.svg",
    shortcut: "/images/logo/logo-icon.svg",
    apple: "/images/logo/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <SessionAuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              {children}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnHover
                draggable
                theme="colored"
                role="status"
                style={{ position: "fixed", top: 20, right: 20, zIndex: 99999 }}
              />
            </SidebarProvider>
          </ThemeProvider>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
