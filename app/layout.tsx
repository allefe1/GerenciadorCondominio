import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "CondoReserva",
  description: "Gerenciador de condomínio com reservas de áreas comuns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
