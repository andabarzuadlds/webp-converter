import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convertidor de Imágenes - WebP, JPG, PNG",
  description: "Convierte imágenes entre diferentes formatos (WebP, JPG, PNG, HEIC) en el navegador. Sin subir a ningún servidor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
