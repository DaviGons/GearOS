import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança. Sem eles o app respondia sem nenhum: dava para
 * colocar a tela de login dentro de um <iframe> em outro site e capturar
 * clique do usuário (clickjacking).
 *
 * Não tem Content-Security-Policy aqui de propósito. Uma CSP que preste exige
 * nonce por requisição, e o app tem script inline (o do tema, que precisa
 * rodar antes da primeira pintura) — uma CSP com 'unsafe-inline' daria a
 * aparência de proteção sem a proteção. Fica como passo seguinte, junto do
 * nonce no proxy.
 */
const CABECALHOS_DE_SEGURANCA = [
  // ninguém enquadra o app dentro de outro site
  { key: "X-Frame-Options", value: "DENY" },
  // o navegador respeita o Content-Type e não tenta adivinhar
  { key: "X-Content-Type-Options", value: "nosniff" },
  // a URL da O.S. (com o id) não vaza no Referer para sites de fora
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // a câmera é usada no anexo de fotos; o resto fica desligado
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
  // só HTTPS a partir do primeiro acesso (em produção; localhost ignora)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_DE_SEGURANCA }];
  },
  // As telas moravam em /checklists/... até o sistema deixar de ser um
  // checklist. Link salvo no celular do balcão ou mandado no WhatsApp continua
  // chegando na O.S. certa.
  async redirects() {
    return [
      { source: "/checklists/novo", destination: "/os/nova", permanent: true },
      { source: "/checklists/:id", destination: "/os/:id", permanent: true },
    ];
  },
};

export default nextConfig;
