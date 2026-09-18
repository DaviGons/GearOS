"use client";

import { useSyncExternalStore } from "react";
import { CHAVE_TEMA, Tema, aplicarTema } from "@/lib/tema";

/**
 * Loja mínima em volta do localStorage. Existe porque o seletor aparece duas
 * vezes na árvore (aba lateral do desktop e gaveta do celular): sem um ponto
 * comum, clicar em um deixaria o outro mostrando o tema antigo.
 */
const ouvintes = new Set<() => void>();

function lerPreferencia(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // navegação anônima com storage bloqueado: cai no padrão
  }
  return "sistema";
}

function inscrever(aoMudar: () => void) {
  ouvintes.add(aoMudar);

  // outra aba do mesmo navegador mudou o tema
  const deOutraAba = () => {
    aplicarTema(lerPreferencia());
    aoMudar();
  };
  window.addEventListener("storage", deOutraAba);

  return () => {
    ouvintes.delete(aoMudar);
    window.removeEventListener("storage", deOutraAba);
  };
}

function definirTema(tema: Tema) {
  try {
    if (tema === "sistema") localStorage.removeItem(CHAVE_TEMA);
    else localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // sem persistir, o tema ainda vale até recarregar a página
  }
  aplicarTema(tema);
  for (const avisar of [...ouvintes]) avisar();
}

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const OPCOES: { valor: Tema; rotulo: string; icone: React.ReactNode }[] = [
  {
    valor: "claro",
    rotulo: "Claro",
    icone: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4" />
      </>
    ),
  },
  {
    valor: "escuro",
    rotulo: "Escuro",
    icone: <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z" />,
  },
  {
    valor: "sistema",
    rotulo: "Do sistema",
    icone: (
      <>
        <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
        <path d="M9 20h6" />
      </>
    ),
  },
];

export default function SeletorDeTema() {
  // no servidor não dá para saber a preferência; assume "sistema" e o React
  // corrige na hidratação, depois do script inline já ter pintado a tela certa
  const tema = useSyncExternalStore(inscrever, lerPreferencia, () => "sistema" as Tema);

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className="grid grid-cols-3 gap-0.5 rounded-lg border border-border bg-background p-0.5"
    >
      {OPCOES.map((opcao) => {
        const ativo = tema === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => definirTema(opcao.valor)}
            aria-pressed={ativo}
            title={opcao.rotulo}
            className={`flex items-center justify-center rounded-md py-1.5 ${
              ativo
                ? "bg-surface text-foreground shadow-sm shadow-sombra/10"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" {...traco}>
              {opcao.icone}
            </svg>
            <span className="sr-only">{opcao.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
