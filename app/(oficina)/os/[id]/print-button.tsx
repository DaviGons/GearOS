"use client";

/**
 * Guardado de propósito, sem estar montado em lugar nenhum.
 *
 * Imprimir a O.S. deixou de fazer sentido no dia a dia da oficina, então o
 * botão saiu da tela — mas a impressão em si continua de pé: as classes
 * `print:` do editor-da-os e o bloco `@media print` do globals.css seguem
 * lá, e este botão é só o gatilho. Quando existir orçamento, é daqui que sai.
 */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
    >
      Imprimir
    </button>
  );
}
