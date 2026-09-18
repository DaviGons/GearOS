"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChecklistResumo, STATUS_LABEL, STATUS_ORDER, Status } from "@/lib/types";
import { STATUS_COLUMN_ACCENT, STATUS_DOT_CLASS } from "@/lib/status-style";
import { fetchComRetry } from "@/lib/fetch-retry";

function groupByStatus(rows: ChecklistResumo[]): Record<Status, ChecklistResumo[]> {
  const grupos: Record<Status, ChecklistResumo[]> = {
    recebido: [],
    em_andamento: [],
    finalizado: [],
    entregue: [],
  };
  for (const row of rows) grupos[row.status]?.push(row);
  return grupos;
}

export default function Board({ rows: initialRows }: { rows: ChecklistResumo[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limpando, setLimpando] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const colunas = groupByStatus(rows);
  const activeRow = rows.find((r) => r.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const id = Number(active.id);
    const newStatus = over.id as Status;
    const current = rows.find((r) => r.id === id);
    if (!current || current.status === newStatus) return;

    const previous = rows;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    setError(null);

    try {
      const res = await fetchComRetry(`/api/checklists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(previous);
      setError("Não consegui mover a O.S. Tente de novo.");
    }
  }

  async function limparEntregues() {
    setLimpando(true);
    setError(null);
    try {
      const res = await fetchComRetry("/api/checklists/entregues", { method: "DELETE" });
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}));
        throw new Error(dados.error || "Não consegui excluir as O.S. entregues.");
      }
      setRows((prev) => prev.filter((r) => r.status !== "entregue"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não consegui excluir as O.S. entregues.");
    } finally {
      setLimpando(false);
    }
  }

  return (
    <DndContext
      id="board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-danger/25 bg-danger/8 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Coluna tem largura fixa e o container tem teto: as quatro somam menos
          que o max-w da página, então em monitor grande elas param de crescer
          em vez de esticar até a borda, e em tela estreita a faixa rola na
          horizontal — que é como um quadro kanban deve se comportar. */}
      <div className="-mx-4 min-h-0 flex-1 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 xl:mx-0 xl:px-0">
        <div className="flex min-w-max gap-3">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              rows={colunas[status]}
              onLimpar={status === "entregue" ? limparEntregues : undefined}
              limpando={limpando}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
        {activeRow ? <CardContent row={activeRow} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  rows,
  onLimpar,
  limpando,
}: {
  status: Status;
  rows: ChecklistResumo[];
  onLimpar?: () => void;
  limpando: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section
      ref={setNodeRef}
      className={`flex w-[264px] shrink-0 flex-col rounded-xl border border-t-2 bg-surface/70 ${
        STATUS_COLUMN_ACCENT[status]
      } ${isOver ? "border-accent/40 bg-surface" : "border-border"}`}
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`} />
        <h2 className="truncate text-sm font-medium text-foreground">{STATUS_LABEL[status]}</h2>
        <span className="ml-auto text-xs tabular-nums text-muted">{rows.length}</span>

        {onLimpar && rows.length > 0 && !confirmando && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            title={`Excluir as ${rows.length} O.S. já entregues`}
            aria-label={`Excluir as ${rows.length} O.S. já entregues`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger hover:bg-danger hover:text-danger-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1L18 7M9.5 7V4.5h5V7" />
            </svg>
          </button>
        )}
      </header>

      {confirmando && (
        <div className="border-b border-danger/25 bg-danger/8 px-3 py-2.5">
          <p className="text-xs text-danger">
            Excluir {rows.length} {rows.length === 1 ? "O.S. entregue" : "O.S. entregues"}? As
            fotos e arquivos delas também vão junto, sem volta.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={limpando}
              onClick={() => {
                setConfirmando(false);
                onLimpar?.();
              }}
              className="rounded-md bg-danger px-2.5 py-1 text-xs font-medium text-danger-foreground hover:opacity-90 disabled:opacity-50"
            >
              {limpando ? "Excluindo..." : "Excluir"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-surface-hover"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex max-h-[min(60vh,560px)] min-h-[88px] flex-col gap-2 overflow-y-auto p-2">
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted/60">Solte aqui</p>
        ) : (
          rows.map((row) => <Card key={row.id} row={row} />)
        )}
      </div>
    </section>
  );
}

function Card({ row }: { row: ChecklistResumo }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id });

  return (
    <Link
      ref={setNodeRef}
      href={`/checklists/${row.id}`}
      {...listeners}
      {...attributes}
      className="block touch-none select-none"
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <CardContent row={row} />
    </Link>
  );
}

function CardContent({ row, dragging }: { row: ChecklistResumo; dragging?: boolean }) {
  return (
    <div
      className={`cursor-grab rounded-lg border border-border bg-surface p-2.5 active:cursor-grabbing hover:border-border-hover ${
        dragging ? "rotate-2 shadow-lg shadow-sombra/15" : ""
      }`}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{row.cliente_nome}</p>
        <span className="shrink-0 font-mono text-[11px] text-muted/70">#{row.id}</span>
      </div>
      <p className="truncate text-xs text-muted">
        {[row.veiculo_marca, row.veiculo_modelo].filter(Boolean).join(" ") || "—"}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted">
          {row.veiculo_placa}
        </span>
        <span className="text-[11px] text-muted/70">
          {new Date(row.criado_em).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}
