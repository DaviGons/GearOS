"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchComRetry } from "@/lib/fetch-retry";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetchComRetry(`/api/os/${id}`, { method: "DELETE" });
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-muted">Apagar a O.S. e os anexos, sem volta?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-xl bg-danger px-3.5 py-2 text-sm font-semibold text-danger-foreground hover:opacity-90 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Excluir"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
      >
        Excluir O.S.
      </button>
    </div>
  );
}
