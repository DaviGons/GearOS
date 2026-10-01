import type { OrdemDeServico, Status } from "@/lib/types";
import { linkWhatsApp, mensagemDoAviso, telefoneWhatsApp, temAviso } from "@/lib/whatsapp";

/**
 * Atalho para avisar o cliente pelo WhatsApp nas duas etapas que ele espera
 * ouvir: o carro chegou e o carro está pronto. Some quando a O.S. não tem
 * telefone válido ou está em outra etapa.
 */
export default function AvisoWhatsApp({
  status,
  os,
  linkDoPortal,
  telefoneAlterado,
}: {
  status: Status;
  os: OrdemDeServico;
  linkDoPortal: string;
  /** o campo de telefone foi mexido e ainda não salvo */
  telefoneAlterado: boolean;
}) {
  if (!temAviso(status)) return null;

  // o telefone salvo, não o do campo: é com ele que o cliente entra no portal
  const telefone = telefoneWhatsApp(os.cliente_telefone);
  if (!telefone) return null;

  const primeiroNome = os.cliente_nome.trim().split(/\s+/)[0];
  const href = linkWhatsApp(telefone, mensagemDoAviso(status, os, linkDoPortal));

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div>
        <p className="text-[15px] font-medium text-foreground">
          {status === "recebido" ? "Avise que o carro chegou" : "Avise que o carro está pronto"}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {telefoneAlterado
            ? "Salve o telefone novo antes: a mensagem vai para o número salvo."
            : `Abre o WhatsApp com a mensagem pronta para ${primeiroNome}. Você revisa e envia.`}
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-status-finalizado px-4 py-2.5 text-[15px] font-semibold text-surface hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z" />
        </svg>
        Avisar no WhatsApp
      </a>
    </div>
  );
}
