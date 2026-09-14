"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Checklist, STATUS_LABEL, STATUS_ORDER, Status } from "@/lib/types";
import { STATUS_COLUMN_ACCENT } from "@/lib/status-style";
import { fetchComRetry } from "@/lib/fetch-retry";

function groupByStatus(rows: Checklist[]): Record<Status, Checklist[]> {
  const grupos: Record<Status, Checklist[]> = {
    recebido: [],
    em_andamento: [],
    finalizado: [],
    entregue: [],
  };
  for (const row of rows) grupos[row.status]?.push(row);
  return grupos;
}

export default function Board({ rows: initialRows }: { rows: Checklist[] }) {
  const [rows, setRows] = useState(initialRows);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <DndContext
      id="board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {error && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max h-full">
          {STATUS_ORDER.map((status) => (
            <Column key={status} status={status} rows={colunas[status]} />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
        {activeRow ? <CardContent row={activeRow} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, rows }: { status: Status; rows: Checklist[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`w-[280px] sm:w-[300px] flex-shrink-0 flex flex-col rounded-lg border border-t-2 bg-surface/60 ${STATUS_COLUMN_ACCENT[status]} ${
        isOver ? "border-accent bg-surface" : "border-border"
      }`}
    >
      <header className="flex items-center justify-between px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{STATUS_LABEL[status]}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
          {rows.length}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-2.5 overflow-y-auto min-h-[80px]">
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted/70">Solte aqui</p>
        ) : (
          rows.map((row) => <Card key={row.id} row={row} />)
        )}
      </div>
    </section>
  );
}

function Card({ row }: { row: Checklist }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id });

  return (
    <Link
      ref={setNodeRef}
      href={`/checklists/${row.id}`}
      {...listeners}
      {...attributes}
      className="touch-none select-none block"
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <CardContent row={row} />
    </Link>
  );
}

function CardContent({ row, dragging }: { row: Checklist; dragging?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-3 cursor-grab active:cursor-grabbing hover:border-accent/50 hover:bg-surface-hover ${
        dragging ? "shadow-lg shadow-black/30 rotate-2" : ""
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight">{row.cliente_nome}</p>
        <span className="text-[11px] font-mono text-muted/60 shrink-0">#{row.id}</span>
      </div>
      <p className="text-xs text-muted">
        {row.veiculo_marca} {row.veiculo_modelo}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="rounded bg-background px-1.5 py-0.5 text-[11px] font-mono text-muted">
          {row.veiculo_placa}
        </span>
        <span className="text-[11px] text-muted/70">
          {new Date(row.criado_em).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}
