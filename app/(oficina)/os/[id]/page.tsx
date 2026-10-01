import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrdemDeServico, TABELA_OS } from "@/lib/types";
import { BUCKET_ANEXOS } from "@/lib/anexos";
import DeleteButton from "./delete-button";
import EditorDaOS from "./editor-da-os";
import type { Anexo } from "./anexos";

export default async function PaginaDaOS({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fotos_pendentes?: string }>;
}) {
  const [{ id }, { fotos_pendentes }, cabecalhos] = await Promise.all([
    params,
    searchParams,
    headers(),
  ]);
  // vem da tela de receber veículo quando parte das fotos não subiu
  const fotosPendentes = Math.max(0, Math.floor(Number(fotos_pendentes) || 0));
  const linkDoPortal = enderecoDoPortal(cabecalhos);
  const supabase = await createClient();

  const { data: row } = await supabase
    .from(TABELA_OS)
    .select("*")
    .eq("id", id)
    .single();

  if (!row) notFound();

  const os = row as OrdemDeServico;

  // O bucket é privado: cada anexo vira uma URL assinada de 1h. O caminho vai
  // junto porque é ele, e não a URL, que identifica o arquivo na hora de
  // remover.
  let anexos: Anexo[] = [];
  if (os.fotos.length > 0) {
    const { data: assinadas } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrls(os.fotos, 3600);

    anexos = (assinadas ?? [])
      .map((item, i) => ({ caminho: os.fotos[i], url: item.signedUrl }))
      .filter((a): a is Anexo => Boolean(a.caminho && a.url));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-9 print:max-w-full print:py-0">
      <div className="mb-3 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Quadro
        </Link>
        <DeleteButton id={os.id} />
      </div>

      <EditorDaOS
        os={os}
        anexos={anexos}
        fotosPendentes={fotosPendentes}
        linkDoPortal={linkDoPortal}
      />
    </main>
  );
}

/**
 * Endereço do portal do cliente, para ir no aviso de WhatsApp. Sai do próprio
 * pedido, e não de uma variável fixa: assim o link aponta para onde o app está
 * de fato — localhost, preview da Vercel ou o domínio de produção.
 */
function enderecoDoPortal(cabecalhos: Headers): string {
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "localhost:3000";
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}/login?portal=1`;
}
