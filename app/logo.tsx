// Marca do GearOS: uma engrenagem de 8 dentes com um "check" que atravessa o
// anel. O vazado do check é recortado da própria engrenagem (máscara), então o
// símbolo lê como "engrenagem" e "serviço concluído" ao mesmo tempo.
//
// Desenhado em vetor (e não como imagem) de propósito: fica nítido em qualquer
// tamanho, acompanha as cores do tema e não custa nenhum request.
// A geometria vive em lib/brand.ts, compartilhada com o favicon e os PNGs.

import { CHECK, DENTE, DENTES } from "@/lib/brand";

export function GearMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <mask id="gearos-mark-cut">
        <rect width="64" height="64" fill="#fff" />
        {/* miolo vazado + folga ao redor do check, para o check nascer do vazio
            da engrenagem em vez de ficar colado por cima dela */}
        <circle cx="32" cy="32" r="14" fill="#000" />
        <path
          d={CHECK}
          fill="none"
          stroke="#000"
          strokeWidth="9.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>

      <g
        mask="url(#gearos-mark-cut)"
        fill="var(--primary)"
        stroke="var(--primary)"
        strokeWidth="2.8"
        strokeLinejoin="round"
      >
        <circle cx="32" cy="32" r="21.5" stroke="none" />
        {DENTES.map((angulo) => (
          <path key={angulo} d={DENTE} transform={`rotate(${angulo} 32 32)`} />
        ))}
      </g>

      <path
        className="gearos-check"
        d={CHECK}
        fill="none"
        stroke="var(--attention)"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TAMANHOS = {
  sm: { mark: "h-6 w-6", texto: "text-base" },
  md: { mark: "h-8 w-8", texto: "text-xl" },
  lg: { mark: "h-9 w-9", texto: "text-2xl" },
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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GearMark className={mark} />
      <span className={`font-bold tracking-tight text-foreground ${texto}`}>GearOS</span>
    </span>
  );
}
