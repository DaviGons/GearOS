"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-hover"
    >
      Imprimir
    </button>
  );
}
