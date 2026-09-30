// Fonte única da geometria e das cores da marca.
//
// Quem usa:
//   - app/logo.tsx            (marca em React, dentro do app)
//   - app/apple-icon.tsx      (ícone de app, PNG gerado)
//   - app/opengraph-image.tsx (card de compartilhamento, PNG gerado)
//   - app/icon.svg            (favicon — arquivo estático, cópia manual daqui)
//
// As cores espelham as variáveis de app/globals.css. Aqui elas precisam ser
// literais porque os PNGs são gerados fora do navegador, sem CSS.

export const CORES = {
  fundo: "#f2f4f7", // azulejo
  tinta: "#15202b", // marinho quase preto
  verde: "#1f9d5c", // o check: "tudo certo"
  muted: "#5b6878",
} as const;

// A marca é uma porca sextavada vista de frente, com lado plano em cima —
// a orientação em que ela aparece apertada num parafuso. Traço único, sem
// preenchimento: é a peça mais simples de uma oficina e a que melhor aguenta
// ser reduzida a 16px.
export const HEXAGONO = "58 32 45 54.52 19 54.52 6 32 19 9.48 45 9.48";
export const CHECK = "M23.5 32.5 L29.5 38.5 L41 24";

/** A marca como string SVG (viewBox 0 0 64 64), para uso fora do React. */
function markSvg({
  traco = CORES.tinta,
  destaque = CORES.verde,
  espessura = 4.5,
  fundo,
}: {
  traco?: string;
  destaque?: string;
  /** Traço mais grosso compensa a perda de peso em tamanhos muito pequenos. */
  espessura?: number;
  /** Se informado, desenha um quadrado arredondado atrás da marca. */
  fundo?: string;
} = {}) {
  const marca =
    `<polygon points="${HEXAGONO}" fill="none" stroke="${traco}" stroke-width="${espessura}" stroke-linejoin="round"/>` +
    `<path d="${CHECK}" fill="none" stroke="${destaque}" stroke-width="${espessura}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const conteudo = fundo
    ? `<rect width="64" height="64" rx="14" fill="${fundo}"/>` +
      `<g transform="translate(32 32) scale(0.78) translate(-32 -32)">${marca}</g>`
    : marca;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${conteudo}</svg>`;
}

/** A marca como data URI, formato aceito pelo gerador de imagens do Next. */
export function markDataUri(opcoes?: Parameters<typeof markSvg>[0]) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(markSvg(opcoes))}`;
}
