"use client";

import { useState } from "react";
import { Logo } from "../logo";
import Sidebar from "./sidebar";

/**
 * Moldura das telas da oficina: aba lateral fixa no desktop, gaveta no celular.
 * Some inteira na impressão — a O.S. impressa não leva menu junto.
 */
export default function Shell({ children }: { children: React.ReactNode }) {
  const [gavetaAberta, setGavetaAberta] = useState(false);

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface md:block print:hidden">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {gavetaAberta && (
        <div className="fixed inset-0 z-40 md:hidden print:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setGavetaAberta(false)}
            className="absolute inset-0 bg-foreground/25"
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 w-60 border-r border-border bg-surface shadow-xl">
            <Sidebar aoNavegar={() => setGavetaAberta(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 md:hidden print:hidden">
          <button
            type="button"
            onClick={() => setGavetaAberta(true)}
            aria-label="Abrir menu"
            className="-ml-1 rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Logo size="md" />
        </header>

        {children}
      </div>
    </div>
  );
}
