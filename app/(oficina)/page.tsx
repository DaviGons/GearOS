import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Checklist } from "@/lib/types";
import Board from "./board";

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

  return (
    <main className="animate-fade-in flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-8 sm:py-9">
      {/* o quadro tem teto de largura: sem isso as colunas esticam até a borda
          da tela e o cartão fica largo e vazio em monitor grande */}
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Quadro de O.S.</h1>
            <p className="mt-0.5 text-sm text-muted">
              {rows.length === 0
                ? "Nenhuma ordem de serviço"
                : `${rows.length} ${rows.length === 1 ? "ordem de serviço" : "ordens de serviço"}`}
              {query && " na busca"}
            </p>
          </div>

          <Link
            href="/checklists/novo"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova O.S.
          </Link>
        </header>

        <form method="get" className="mb-4">
          <div className="relative max-w-sm">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por cliente, placa ou modelo..."
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </form>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-muted">
            {query ? "Nenhuma O.S. encontrada para essa busca." : "Nenhuma O.S. cadastrada ainda."}
          </p>
        ) : (
          <Board rows={rows} />
        )}
      </div>
    </main>
  );
}
