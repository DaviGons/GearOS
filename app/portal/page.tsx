import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PORTAL_COOKIE_NAME, verifyPortalToken } from "@/lib/portal-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrdemDeServico, STATUS_LABEL, STATUS_ORDER, Status, TIPO_COMBUSTIVEL_LABEL, TABELA_OS } from "@/lib/types";
import { cadastroClienteCompleto } from "@/lib/validation";
import { BUCKET_ANEXOS, ehImagem } from "@/lib/anexos";
import PortalLogoutButton from "./logout-button";
import CadastroForm from "./cadastro-form";
import { Logo } from "../logo";
import { Placa } from "../placa";

/** O que o cliente lê sobre o carro dele, em cada etapa. */
const MENSAGEM: Record<Status, { titulo: string; texto: string }> = {
  recebido: {
    titulo: "Seu carro chegou",
    texto: "Ele está na fila e logo vai para as mãos do mecânico.",
  },
  em_andamento: {
    titulo: "Estamos cuidando do seu carro",
    texto: "O mecânico está trabalhando nele agora.",
  },
  finalizado: {
    titulo: "Pronto para retirar",
    texto: "O serviço terminou. Pode vir buscar quando quiser.",
  },
  entregue: {
    titulo: "Carro entregue",
    texto: "Obrigado pela confiança. Até a próxima.",
  },
};

// o servidor roda em UTC; o cliente está no Brasil
const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });
const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function Topo() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <Logo size="lg" />
      <PortalLogoutButton />
    </header>
  );
}

export default async function PortalPage() {
  const cookieStore = await cookies();
  const osId = verifyPortalToken(cookieStore.get(PORTAL_COOKIE_NAME)?.value);

  if (!osId) redirect("/login?portal=1");

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from(TABELA_OS)
    .select("*")
    .eq("id", osId)
    .single();

  if (!row) redirect("/login?portal=1");

  const os = row as OrdemDeServico;

  if (!cadastroClienteCompleto(os)) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-9">
        <Topo />
        <CadastroForm os={os} />
      </main>
    );
  }

  // O cliente vê só as fotos. Documentos anexados na O.S. (orçamento, nota,
  // laudo) são material interno da oficina e ficam de fora daqui.
  const caminhosDeFoto = os.fotos.filter(ehImagem);

  let fotoUrls: string[] = [];
  if (caminhosDeFoto.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrls(caminhosDeFoto, 3600);
    fotoUrls = (signed ?? [])
      .map((s) => s.signedUrl)
      .filter((url): url is string => Boolean(url));
  }

  const currentIndex = STATUS_ORDER.indexOf(os.status);
  const mensagem = MENSAGEM[os.status];
  const veiculo = [os.veiculo_marca, os.veiculo_modelo].filter(Boolean).join(" ");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-9">
      <Topo />

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {mensagem.titulo}
            </h1>
            <p className="mt-1.5 text-[15px] text-muted">{mensagem.texto}</p>
          </div>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <Placa placa={os.veiculo_placa} size="lg" />
            {veiculo && <p className="text-sm text-muted">{veiculo}</p>}
          </div>
        </div>

        <Stepper currentIndex={currentIndex} />
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <h2 className="font-display text-xl font-semibold text-foreground">O serviço</h2>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
          {os.observacoes}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
          <Info label="Entrada" value={DATA.format(new Date(os.criado_em))} />
          <Info label="Ano" value={os.veiculo_ano} />
          <Info label="Cor" value={os.veiculo_cor} />
          <Info
            label="Combustível"
            value={
              os.veiculo_tipo_combustivel
                ? TIPO_COMBUSTIVEL_LABEL[os.veiculo_tipo_combustivel]
                : null
            }
          />
        </dl>
      </section>

      {fotoUrls.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-foreground">Fotos do seu carro</h2>
          <p className="mt-0.5 text-sm text-muted">Tiradas pela oficina. Toque para ver maior.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotoUrls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-xl border border-border hover:border-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1} do carro`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        O.S. {os.id}. Atualizado em {DATA_E_HORA.format(new Date(os.atualizado_em))}.
      </p>
    </main>
  );
}

/** As quatro etapas do conserto, em ordem: aqui os números são o próprio caminho. */
function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="mt-8 flex items-start">
      {STATUS_ORDER.map((status, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li
            key={status}
            aria-current={active ? "step" : undefined}
            className="flex flex-1 flex-col items-center last:flex-none"
          >
            <div className="flex w-full items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold ${
                  done
                    ? "bg-marca text-white"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                      : "border-2 border-border bg-surface text-muted"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={`mx-1 h-1 flex-1 rounded-full ${done ? "bg-marca" : "bg-border"}`} />
              )}
            </div>
            <p
              className={`mt-2 w-16 text-center text-xs leading-tight sm:w-auto ${
                active ? "font-semibold text-foreground" : "text-muted"
              }`}
            >
              {STATUS_LABEL[status]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-[15px] font-medium text-foreground">{value || "Não informado"}</dd>
    </div>
  );
}
