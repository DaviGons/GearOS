"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/checklists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setError("Não consegui excluir. Tente de novo.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-danger">{error}</span>}
        <span className="text-xs text-muted">Excluir definitivamente?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-danger-foreground hover:opacity-90 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-danger/30 bg-transparent px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
    >
      Excluir O.S.
    </button>
  );
}
