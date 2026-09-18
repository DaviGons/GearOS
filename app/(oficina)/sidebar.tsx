"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../logo";
import LogoutButton from "./logout-button";

type Item = {
  href: string;
  rotulo: string;
  icone: React.ReactNode;
  /** casa também com as sub-rotas (ex.: /checklists/12) */
  prefixo?: string;
};

// Ícones em traço único, no mesmo peso do resto da interface.
const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icone({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" {...traco}>
      {children}
    </svg>
  );
}

const ITENS: Item[] = [
  {
    href: "/",
    rotulo: "Quadro",
    icone: (
      <Icone>
        <rect x="3" y="4" width="5.5" height="16" rx="1.5" />
        <rect x="9.25" y="4" width="5.5" height="11" rx="1.5" />
        <rect x="15.5" y="4" width="5.5" height="7" rx="1.5" />
      </Icone>
    ),
  },
  {
    href: "/checklists/novo",
    rotulo: "Nova O.S.",
    icone: (
      <Icone>
        <path d="M12 5v14M5 12h14" />
      </Icone>
    ),
  },
];

// Espaço já reservado para o que vem depois. Ficam visíveis e desabilitados de
// propósito: mostram para onde o sistema está indo sem prometer o que não
// existe ainda.
const FUTUROS: { rotulo: string; icone: React.ReactNode }[] = [
  {
    rotulo: "Clientes",
    icone: (
      <Icone>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M4.5 19.5a7.5 7.5 0 0 1 15 0" />
      </Icone>
    ),
  },
  {
    rotulo: "Peças e estoque",
    icone: (
      <Icone>
        <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
        <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
      </Icone>
    ),
  },
  {
    rotulo: "Financeiro",
    icone: (
      <Icone>
        <path d="M4 18V9M9.5 18V5M15 18v-6M20.5 18v-9" />
      </Icone>
    ),
  },
  {
    rotulo: "Relatórios",
    icone: (
      <Icone>
        <path d="M5 3.5h9l5 5V20a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 20z" />
        <path d="M14 3.5V9h5" />
      </Icone>
    ),
  },
];

export default function Sidebar({ aoNavegar }: { aoNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <Link href="/" onClick={aoNavegar} className="px-2">
        <Logo size="lg" />
      </Link>

      <nav className="flex flex-col gap-0.5">
        {ITENS.map((item) => {
          const ativo =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={aoNavegar}
              aria-current={ativo ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                ativo
                  ? "bg-accent/8 font-medium text-accent"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {item.icone}
              {item.rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-0.5">
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted/70">
          Em breve
        </p>
        {FUTUROS.map((item) => (
          <span
            key={item.rotulo}
            aria-disabled="true"
            title="Ainda não implementado"
            className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted/45"
          >
            {item.icone}
            {item.rotulo}
          </span>
        ))}
      </div>

      <div className="mt-auto border-t border-border pt-3">
        <LogoutButton />
      </div>
    </div>
  );
}
