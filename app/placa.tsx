// A placa Mercosul desenhada em CSS: faixa azul com "BRASIL" em cima,
// caracteres grandes embaixo. É o jeito como todo mundo na oficina — e o
// próprio cliente — reconhece um carro de relance, então ela aparece igual no
// quadro, na O.S. e no portal. Sem hooks: serve em server e client component.

const TAMANHOS = {
  sm: {
    caixa: "min-w-[88px] rounded-[3px] border",
    faixa: "h-[5px]",
    rotulo: null,
    texto: "px-1.5 text-[13px] leading-[20px]",
  },
  md: {
    caixa: "min-w-[120px] rounded-[4px] border-[1.5px]",
    faixa: "h-[11px]",
    rotulo: "text-[7px]",
    texto: "px-2.5 text-[19px] leading-[28px]",
  },
  lg: {
    caixa: "min-w-[176px] rounded-md border-2",
    faixa: "h-[16px]",
    rotulo: "text-[10px]",
    texto: "px-3.5 text-[28px] leading-[42px]",
  },
} as const;

export function Placa({
  placa,
  size = "md",
  className = "",
}: {
  placa: string;
  size?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const t = TAMANHOS[size];
  return (
    <span
      className={`inline-flex flex-col overflow-hidden border-placa-texto/80 bg-placa-fundo text-center align-middle ${t.caixa} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex items-center justify-center bg-placa-faixa font-display font-semibold tracking-[0.3em] text-white ${t.faixa} ${t.rotulo ?? ""}`}
      >
        {t.rotulo && "BRASIL"}
      </span>
      <span
        className={`font-display font-medium tracking-[0.06em] text-placa-texto tabular-nums ${t.texto}`}
      >
        <span className="sr-only">Placa </span>
        {placa}
      </span>
    </span>
  );
}
