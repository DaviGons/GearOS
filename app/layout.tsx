import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CORES } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRICAO = "Gestão de oficina, do check-in à entrega.";

// Endereço público do site. Sem isto, o link da imagem de compartilhamento sai
// apontando para localhost e o WhatsApp/Telegram não conseguem carregá-la.
// A Vercel injeta VERCEL_PROJECT_PRODUCTION_URL no build de produção.
const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "GearOS",
    template: "%s · GearOS",
  },
  description: DESCRICAO,
  applicationName: "GearOS",
  openGraph: {
    title: "GearOS",
    description: DESCRICAO,
    siteName: "GearOS",
    locale: "pt_BR",
    type: "website",
  },
};

// a cor da barra do navegador no celular acompanha o fundo do app
export const viewport: Viewport = {
  themeColor: CORES.fundo,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
