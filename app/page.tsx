import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Checklist, STATUS_LABEL, STATUS_ORDER, Status } from "@/lib/types";
import { STATUS_COLUMN_ACCENT } from "@/lib/status-style";
import LogoutButton from "./logout-button";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const supabase = await createClient();
  let dbQuery = supabase.from("checklists").select("*").order("id", { ascending: false }).limit(300);
  if (query) {
    dbQuery = dbQuery.or(
      `cliente_nome.ilike.%${query}%,veiculo_placa.ilike.%${query}%,veiculo_modelo.ilike.%${query}%`
    );
  }
  const { data } = await dbQuery;
  const rows = (data ?? []) as Checklist[];

  const colunas: Record<Status, Checklist[]> = {
    recebido: [],
    em_andamento: [],
    finalizado: [],
    entregue: [],
  };
  for (const row of rows) {
    colunas[row.status]?.push(row);
  }

  return (
    <main className="animate-fade-in flex-1 mx-auto w-full max-w-[1400px] px-4 py-8 flex flex-col min-h-0">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">GearOS</h1>
          <p className="text-sm text-muted">Ordens de serviço da oficina</p>
        </div>
        <div className="flex items-center gap-4">
          <LogoutButton />
          <Link
            href="/checklists/novo"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md"
          >
            Cadastrar Entrada
          </Link>
        </div>
      </header>

      <form method="get" className="mb-5">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Buscar por cliente, placa ou modelo..."
          className="w-full max-w-md rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
          {query ? "Nenhuma O.S. encontrada para essa busca." : "Nenhuma O.S. cadastrada ainda."}
        </p>
      ) : (
        <div className="flex-1 overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max h-full">
            {STATUS_ORDER.map((status) => (
              <Column key={status} status={status} rows={colunas[status]} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Column({ status, rows }: { status: Status; rows: Checklist[] }) {
  return (
    <section
      className={`w-[280px] sm:w-[300px] flex-shrink-0 flex flex-col rounded-lg border border-border border-t-2 bg-surface/60 ${STATUS_COLUMN_ACCENT[status]}`}
    >
      <header className="flex items-center justify-between px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{STATUS_LABEL[status]}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
          {rows.length}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-2.5 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted/70">Nenhuma O.S. aqui</p>
        ) : (
          rows.map((row) => <Card key={row.id} row={row} />)
        )}
      </div>
    </section>
  );
}

function Card({ row }: { row: Checklist }) {
  return (
    <Link
      href={`/checklists/${row.id}`}
      className="block rounded-lg border border-border bg-surface p-3 hover:border-accent/50 hover:bg-surface-hover"
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
    </Link>
  );
}
