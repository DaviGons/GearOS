import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PORTAL_COOKIE_NAME, verifyPortalToken } from "@/lib/portal-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Checklist, STATUS_LABEL, STATUS_ORDER, TIPO_COMBUSTIVEL_LABEL } from "@/lib/types";
import PortalLogoutButton from "./logout-button";

export default async function PortalPage() {
  const cookieStore = await cookies();
  const checklistId = verifyPortalToken(cookieStore.get(PORTAL_COOKIE_NAME)?.value);

  if (!checklistId) redirect("/login?portal=1");

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("checklists")
    .select("*")
    .eq("id", checklistId)
    .single();

  if (!row) redirect("/login?portal=1");

  const checklist = row as Checklist;

  let fotoUrls: string[] = [];
  if (checklist.fotos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("checklist-fotos")
      .createSignedUrls(checklist.fotos, 3600);
    fotoUrls = (signed ?? [])
      .map((s) => s.signedUrl)
      .filter((url): url is string => Boolean(url));
  }

  const currentIndex = STATUS_ORDER.indexOf(checklist.status);

  return (
    <main className="animate-fade-in flex-1 mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">GearOS</h1>
          <p className="text-sm text-muted">Acompanhamento do seu veículo</p>
        </div>
        <PortalLogoutButton />
      </header>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {checklist.veiculo_marca} {checklist.veiculo_modelo}
            </p>
            <p className="text-sm text-muted">Placa {checklist.veiculo_placa}</p>
          </div>
          <span className="text-xs font-mono text-muted/60">#{checklist.id}</span>
        </div>

        <Stepper currentIndex={currentIndex} />

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Info label="Ano" value={checklist.veiculo_ano} />
          <Info label="Cor" value={checklist.veiculo_cor} />
          <Info
            label="Combustível"
            value={
              checklist.veiculo_tipo_combustivel
                ? TIPO_COMBUSTIVEL_LABEL[checklist.veiculo_tipo_combustivel]
                : null
            }
          />
          <Info label="Entrada" value={new Date(checklist.criado_em).toLocaleDateString("pt-BR")} />
        </div>

        <section className="mt-6">
          <h2 className="mb-1 text-sm font-semibold text-foreground">O que está sendo feito</h2>
          <p className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-foreground">
            {checklist.observacoes}
          </p>
        </section>

        {fotoUrls.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Fotos registradas na entrada</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {fotoUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg border border-border hover:border-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1} do veículo`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </section>
        )}

        <p className="mt-6 text-center text-xs text-muted/70">
          Última atualização: {new Date(checklist.atualizado_em).toLocaleString("pt-BR")}
        </p>
      </div>
    </main>
  );
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex items-start">
      {STATUS_ORDER.map((status, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={status} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-attention text-attention-foreground"
                      : "bg-background text-muted border border-border"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <p
              className={`mt-2 text-center text-[11px] leading-tight ${
                active ? "font-semibold text-foreground" : "text-muted"
              }`}
            >
              {STATUS_LABEL[status]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted/70">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}
