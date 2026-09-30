// Marca do GearOS: uma porca sextavada em traço único, com o check em verde
// no vazio dela. Desenhada em vetor (e não como imagem) de propósito: fica
// nítida em qualquer tamanho, acompanha as cores do tema e não custa request.
// A geometria vive em lib/brand.ts, compartilhada com o favicon e os PNGs.

import { CHECK, HEXAGONO } from "@/lib/brand";

export function GearMark({
  className = "h-7 w-7",
  espessura = 4.5,
}: {
  className?: string;
  espessura?: number;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <polygon
        points={HEXAGONO}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={espessura}
        strokeLinejoin="round"
      />
      <path
        d={CHECK}
        fill="none"
        stroke="var(--marca)"
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TAMANHOS = {
  sm: { mark: "h-5 w-5", texto: "text-sm" },
  md: { mark: "h-7 w-7", texto: "text-lg" },
  lg: { mark: "h-8 w-8", texto: "text-xl" },
} as const;

/** Assinatura horizontal: símbolo + "GearOS". */
export function Logo({
  size = "md",
  className = "",
}: {
  size?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const { mark, texto } = TAMANHOS[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <GearMark className={mark} />
      <span className={`font-display font-semibold tracking-tight text-foreground ${texto}`}>GearOS</span>
    </span>
  );
}
