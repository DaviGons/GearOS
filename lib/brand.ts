// Fonte única da geometria e das cores da marca.
//
// Quem usa:
//   - app/logo.tsx          (marca em React, dentro do app)
//   - app/apple-icon.tsx    (ícone de app, PNG gerado)
//   - app/opengraph-image.tsx (card de compartilhamento, PNG gerado)
//   - app/icon.svg          (favicon — arquivo estático, cópia manual daqui)
//
// As cores espelham as variáveis de app/globals.css. Aqui elas precisam ser
// literais porque os PNGs são gerados fora do navegador, sem CSS.

export const CORES = {
  fundo: "#161b33",
  engrenagem: "#246a73",
  destaque: "#ffcf56",
  texto: "#edeff5",
  muted: "#a8a2c4",
} as const;

export const DENTES = [0, 45, 90, 135, 180, 225, 270, 315];
export const DENTE = "M26.4 15 L28.4 4.4 L35.6 4.4 L37.6 15 Z";
export const CHECK = "M24.8 32.4 L30 37.6 L43 21";

/** A marca como string SVG (viewBox 0 0 64 64), para uso fora do React. */
export function markSvg({
  engrenagem = CORES.engrenagem,
  destaque = CORES.destaque,
  fundo,
}: {
  engrenagem?: string;
  destaque?: string;
  /** Se informado, desenha um quadrado arredondado atrás da marca. */
  fundo?: string;
} = {}) {
  const dentes = DENTES.map(
    (a) => `<path d="${DENTE}" transform="rotate(${a} 32 32)"/>`
  ).join("");

  // Com fundo, a marca encolhe para sobrar respiro nas bordas do quadrado.
  const marca = `
    <mask id="c">
      <rect width="64" height="64" fill="#fff"/>
      <circle cx="32" cy="32" r="14" fill="#000"/>
      <path d="${CHECK}" fill="none" stroke="#000" stroke-width="9.4" stroke-linecap="round" stroke-linejoin="round"/>
    </mask>
    <g mask="url(#c)" fill="${engrenagem}" stroke="${engrenagem}" stroke-width="2.8" stroke-linejoin="round">
      <circle cx="32" cy="32" r="21.5" stroke="none"/>
      ${dentes}
    </g>
    <path d="${CHECK}" fill="none" stroke="${destaque}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>`;

  const conteudo = fundo
    ? `<rect width="64" height="64" rx="14" fill="${fundo}"/>` +
      `<g transform="translate(5.8 5.8) scale(0.82)">${marca}</g>`
    : marca;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${conteudo}</svg>`;
}

/** A marca como data URI, formato aceito pelo gerador de imagens do Next. */
export function markDataUri(opcoes?: Parameters<typeof markSvg>[0]) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(markSvg(opcoes))}`;
}
