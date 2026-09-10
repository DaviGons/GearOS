import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Checklist } from "@/lib/types";
import LogoutButton from "./logout-button";
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
    <main className="animate-fade-in flex-1 mx-auto w-full max-w-[1400px] px-4 py-8 flex flex-col min-h-0">
      <header className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">GearOS</h1>
          <p className="text-sm text-muted">Ordens de serviço da oficina</p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <LogoutButton />
          <Link
            href="/checklists/novo"
            className="whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md"
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
        <Board rows={rows} />
      )}
    </main>
  );
}
