import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Checklist, STATUS_LABEL, Status } from "@/lib/types";
import LogoutButton from "./logout-button";

const STATUS_STYLE: Record<Status, string> = {
  aberta: "bg-amber-100 text-amber-800",
  em_andamento: "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const supabase = await createClient();
  let dbQuery = supabase.from("checklists").select("*").order("id", { ascending: false }).limit(200);
  if (query) {
    dbQuery = dbQuery.or(
      `cliente_nome.ilike.%${query}%,veiculo_placa.ilike.%${query}%,veiculo_modelo.ilike.%${query}%`
    );
  }
  const { data } = await dbQuery;
  const rows = (data ?? []) as Checklist[];

  return (
    <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GearOS</h1>
          <p className="text-sm text-slate-500">Ordens de serviço da oficina</p>
        </div>
        <div className="flex items-center gap-4">
          <LogoutButton />
          <Link
            href="/checklists/novo"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Cadastrar Entrada
          </Link>
        </div>
      </header>

      <form method="get" className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Buscar por cliente, placa ou modelo..."
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </form>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {query
              ? "Nenhuma O.S. encontrada para essa busca."
              : "Nenhuma O.S. cadastrada ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/checklists/${row.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {row.cliente_nome}{" "}
                      <span className="text-slate-400 font-normal">
                        · {row.veiculo_marca} {row.veiculo_modelo}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Placa {row.veiculo_placa} — {new Date(row.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                    <span className="text-xs font-mono text-slate-400">#{row.id}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
