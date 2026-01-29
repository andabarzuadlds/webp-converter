import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JPG/PNG → WebP Converter",
  description: "Convierte imágenes JPG y PNG a WebP en el navegador.",
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
