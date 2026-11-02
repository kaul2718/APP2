import { Outfit } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";
import SessionAuthProvider from "@/context/SessionAuthProvider";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const outfit = Outfit({
  subsets: ["latin"],
});

import { getMetadataBase } from "@/lib/seoConfig";

export const metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Hospital del Computador | Servicio Técnico en Riobamba",
    template: "%s | Hospital del Computador",
  },
  description: "Taller y laboratorio especializado en reparación de laptops, computadoras e impresoras en Riobamba, Ecuador.",
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
    <html lang="es-EC">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <SessionAuthProvider>
          <FontSizeProvider>
            <ThemeProvider>
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
            </ThemeProvider>
          </FontSizeProvider>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
