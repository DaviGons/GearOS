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
import { OrdemDeServicoResumo, STATUS_DICA, STATUS_LABEL, STATUS_ORDER, Status } from "@/lib/types";
import { STATUS_DOT_CLASS, STATUS_FURO_CLASS, STATUS_TAG_CLASS } from "@/lib/status-style";
import { fetchComRetry } from "@/lib/fetch-retry";
import { Placa } from "../placa";

function groupByStatus(rows: OrdemDeServicoResumo[]): Record<Status, OrdemDeServicoResumo[]> {
  const grupos: Record<Status, OrdemDeServicoResumo[]> = {
    recebido: [],
    em_andamento: [],
    finalizado: [],
    entregue: [],
  };
  for (const row of rows) grupos[row.status]?.push(row);
  return grupos;
}

export default function Board({ rows: initialRows }: { rows: OrdemDeServicoResumo[] }) {
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
      const res = await fetchComRetry(`/api/os/${id}`, {
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
      const res = await fetchComRetry("/api/os/entregues", { method: "DELETE" });
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
        <div role="alert" className="mb-3 rounded-xl border border-danger/25 bg-danger/8 px-4 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Coluna tem largura fixa e o container tem teto: as quatro somam menos
          que o max-w da página, então em monitor grande elas param de crescer
          em vez de esticar até a borda, e em tela estreita a faixa rola na
          horizontal — que é como um quadro kanban deve se comportar. */}
      <div className="-mx-4 min-h-0 flex-1 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 xl:mx-0 xl:px-0">
        <div className="flex min-w-max gap-4">
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
  rows: OrdemDeServicoResumo[];
  onLimpar?: () => void;
  limpando: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section
      ref={setNodeRef}
      className={`flex w-[272px] shrink-0 flex-col rounded-2xl border ${
        isOver ? "border-accent/50 bg-accent/5" : "border-border bg-surface-hover/50"
      }`}
    >
      <header className="px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`} />
          <h2 className="truncate font-display text-lg font-semibold leading-tight text-foreground">
            {STATUS_LABEL[status]}
          </h2>
          <span className="rounded-full bg-surface px-2 text-xs font-medium tabular-nums text-muted">
            {rows.length}
          </span>

          {onLimpar && rows.length > 0 && !confirmando && (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              title={`Excluir as ${rows.length} O.S. já entregues`}
              aria-label={`Excluir as ${rows.length} O.S. já entregues`}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1L18 7M9.5 7V4.5h5V7" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-0.5 pl-4 text-xs text-muted">{STATUS_DICA[status]}</p>
      </header>

      {confirmando && (
        <div className="mx-2 mb-1 rounded-xl border border-danger/25 bg-danger/8 px-3 py-2.5">
          <p className="text-sm text-danger">
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
              className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-danger-foreground hover:opacity-90 disabled:opacity-50"
            >
              {limpando ? "Excluindo..." : "Excluir"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex max-h-[min(62vh,600px)] min-h-[104px] flex-col gap-2 overflow-y-auto p-2">
        {rows.length === 0 ? (
          <p className="m-1 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
            Arraste uma O.S. para cá
          </p>
        ) : (
          rows.map((row) => <Card key={row.id} row={row} />)
        )}
      </div>
    </section>
  );
}

function Card({ row }: { row: OrdemDeServicoResumo }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id });

  return (
    <Link
      ref={setNodeRef}
      href={`/os/${row.id}`}
      {...listeners}
      {...attributes}
      aria-label={`O.S. ${row.id}, ${row.cliente_nome}, placa ${row.veiculo_placa}`}
      className="block touch-none select-none rounded-xl"
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <CardContent row={row} />
    </Link>
  );
}

// fuso fixo: o servidor da Vercel roda em UTC e o navegador no horário do
// Brasil — sem isso, uma O.S. aberta às 22h mostraria dias diferentes nos dois
// e a hidratação reclamaria
const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/**
 * A O.S. no quadro é uma etiqueta de chave, como as que ficam penduradas na
 * recepção: furo em cima, cor do status no corpo, placa embaixo.
 */
function CardContent({ row, dragging }: { row: OrdemDeServicoResumo; dragging?: boolean }) {
  const veiculo = [row.veiculo_marca, row.veiculo_modelo].filter(Boolean).join(" ");

  return (
    <div
      className={`cursor-grab rounded-xl rounded-tl-[22px] border bg-surface p-3 active:cursor-grabbing ${
        STATUS_TAG_CLASS[row.status]
      } ${dragging ? "rotate-2 shadow-xl shadow-sombra/20" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`mt-1 h-3 w-3 shrink-0 rounded-full border-[2.5px] bg-background ${
            STATUS_FURO_CLASS[row.status]
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-base font-semibold tabular-nums text-foreground">
              O.S. {row.id}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {DIA_E_MES.format(new Date(row.criado_em))}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {row.cliente_nome}
          </p>
          {veiculo && <p className="truncate text-xs text-muted">{veiculo}</p>}
          <Placa placa={row.veiculo_placa} size="sm" className="mt-2" />
        </div>
      </div>
    </div>
  );
}
