import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CORES } from "@/lib/brand";
import { SCRIPT_DO_TEMA } from "@/lib/tema";
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

// A cor da barra do navegador no celular acompanha o fundo do app. Fica uma
// meta só, no tema claro; o SCRIPT_DO_TEMA reescreve o content quando a tela
// está no escuro. Se declarasse as duas por media query, o script não teria
// como sobrepor a escolha manual do usuário.
export const viewport: Viewport = {
  themeColor: CORES.fundo,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Script cru, e não <Script strategy="beforeInteractive">: o next/script
          empurra o código para a fila do runtime do Next, que roda depois da
          primeira pintura — e aí a tela pisca branca antes de escurecer. Este
          aqui é síncrono no <head>, que é exatamente o que se quer.

          Em dev o React reclama no console ("Encountered a script tag while
          rendering React component"); o aviso só existe nos builds de
          desenvolvimento e o script já rodou no HTML do servidor.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
