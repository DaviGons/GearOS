import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CAMPOS_RESUMO, OrdemDeServicoResumo, TABELA_OS } from "@/lib/types";
import { filtroDeBusca } from "@/lib/busca";
import Board from "./board";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const supabase = await createClient();
  // só as colunas que o cartão desenha: `select("*")` trazia observacoes e
  // avarias inteiras das 300 O.S. para mostrar nome, placa e data
  let dbQuery = supabase
    .from(TABELA_OS)
    .select(CAMPOS_RESUMO)
    .order("id", { ascending: false })
    .limit(300);
  // o termo nunca entra cru no filtro — ver lib/busca.ts
  if (query) dbQuery = dbQuery.or(filtroDeBusca(query));
  const { data } = await dbQuery;
  const rows = (data ?? []) as OrdemDeServicoResumo[];

  const noPatio = rows.filter((r) => r.status !== "entregue").length;
  const prontos = rows.filter((r) => r.status === "finalizado").length;

  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-8 sm:py-9">
      {/* o quadro tem teto de largura: sem isso as colunas esticam até a borda
          da tela e o cartão fica largo e vazio em monitor grande */}
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
              {query ? "Resultado da busca" : saudacao()}
            </h1>
            <p className="mt-1 text-[15px] text-muted">
              {query
                ? `${rows.length} ${rows.length === 1 ? "O.S. encontrada" : "O.S. encontradas"} para "${query}".`
                : resumoDoPatio(noPatio, prontos)}
            </p>
          </div>

          <Link
            href="/os/nova"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground shadow-sm shadow-sombra/10 hover:bg-primary-hover"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Receber veículo
          </Link>
        </header>

        <form method="get" role="search" className="mb-5 flex max-w-md gap-2">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={query}
              aria-label="Buscar O.S."
              placeholder="Buscar por cliente, placa ou modelo"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-base text-foreground placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm"
            />
          </div>
          {query && (
            <Link
              href="/"
              className="flex items-center rounded-xl px-3 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
            >
              Limpar
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
            <p className="font-display text-xl font-semibold text-foreground">
              {query ? "Nada encontrado" : "Pátio vazio"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              {query
                ? "Confira a grafia ou tente só um pedaço da placa ou do nome."
                : "Quando um carro chegar, registre a entrada dele e ele aparece aqui."}
            </p>
            {!query && (
              <Link
                href="/os/nova"
                className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Receber o primeiro veículo
              </Link>
            )}
          </div>
        ) : (
          <Board rows={rows} />
        )}
      </div>
    </main>
  );
}

// o servidor roda em UTC: sem o fuso, às 21h de Brasília já seria "Boa noite"
// três horas antes da hora
function saudacao() {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    }).format(new Date())
  );
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

function resumoDoPatio(noPatio: number, prontos: number) {
  if (noPatio === 0) return "Nenhum carro na oficina agora.";
  const carros = noPatio === 1 ? "1 carro na oficina" : `${noPatio} carros na oficina`;
  if (prontos === 0) return `${carros}.`;
  const retirada = prontos === 1 ? "1 pronto para retirar" : `${prontos} prontos para retirar`;
  return `${carros}, ${retirada}.`;
}
