"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchComRetry } from "@/lib/fetch-retry";
import {
  ACCEPT_ANEXOS,
  MAX_ANEXOS,
  MAX_ANEXO_MB,
  ehImagem,
  enviarAnexos,
  extensaoDe,
  nomeDoAnexo,
  validarAnexos,
} from "@/lib/anexos";

export type Anexo = { caminho: string; url: string };

export default function Anexos({
  osId,
  anexos,
  fotosPendentes = 0,
}: {
  osId: number;
  anexos: Anexo[];
  /** Fotos que ficaram para trás ao abrir a O.S. — vira aviso até alguém anexar. */
  fotosPendentes?: number;
}) {
  const router = useRouter();
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState(fotosPendentes);

  const cheio = anexos.length >= MAX_ANEXOS;
  const ocupado = enviando || removendo !== null;

  /** Grava a nova lista de caminhos na O.S. e recarrega os dados da página. */
  async function salvarLista(caminhos: string[]) {
    const res = await fetchComRetry(`/api/os/${osId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotos: caminhos }),
    });

    if (!res.ok) {
      const dados = await res.json().catch(() => ({}));
      throw new Error(dados.error || "Não consegui salvar a lista de anexos.");
    }

    router.refresh();
  }

  async function handleArquivosSelecionados(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (selecionados.length === 0) return;

    const { aceitos, erro: erroValidacao } = validarAnexos(selecionados, anexos.length);
    setErro(erroValidacao);
    if (aceitos.length === 0) return;

    setEnviando(true);
    setProgresso(`Enviando (0 de ${aceitos.length})`);

    try {
      const supabase = createClient();
      const { caminhos, falhas } = await enviarAnexos(
        supabase,
        osId,
        aceitos,
        (feitos, total) => setProgresso(`Enviando (${feitos} de ${total})`)
      );

      if (caminhos.length > 0) {
        setProgresso("Guardando na O.S.");
        await salvarLista([...anexos.map((a) => a.caminho), ...caminhos]);
        setPendentes(0);
      }

      if (falhas.length > 0) {
        setErro(`Não consegui enviar: ${falhas.join(", ")}. Tente de novo.`);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar os anexos.");
    } finally {
      setEnviando(false);
      setProgresso(null);
    }
  }

  async function remover(caminho: string) {
    setConfirmando(null);
    setRemovendo(caminho);
    setErro(null);

    try {
      // O arquivo em si é apagado do Storage pela rota, ao ver que ele saiu da
      // lista — assim não sobra lixo no bucket.
      await salvarLista(anexos.filter((a) => a.caminho !== caminho).map((a) => a.caminho));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover o anexo.");
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 print:hidden">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold leading-tight text-foreground">
          Fotos e arquivos
        </h2>
        <span className="text-sm tabular-nums text-muted">
          {anexos.length} de {MAX_ANEXOS}
        </span>
      </div>

      {pendentes > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-attention/30 bg-attention/10 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold">
            {pendentes === 1
              ? "1 foto não chegou a ser enviada."
              : `${pendentes} fotos não chegaram a ser enviadas.`}
          </p>
          <p className="mt-0.5 text-muted">
            A O.S. foi aberta normalmente. Anexe {pendentes === 1 ? "essa foto" : "essas fotos"} de
            novo pelo botão abaixo.
          </p>
        </div>
      )}

      {erro && (
        <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erro}
        </div>
      )}

      {anexos.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {anexos.map((anexo) => (
            <Tile
              key={anexo.caminho}
              anexo={anexo}
              confirmando={confirmando === anexo.caminho}
              removendo={removendo === anexo.caminho}
              desabilitado={ocupado}
              onPedirRemocao={() => setConfirmando(anexo.caminho)}
              onCancelar={() => setConfirmando(null)}
              onConfirmar={() => remover(anexo.caminho)}
            />
          ))}
        </div>
      )}

      {enviando && (
        <p role="status" className="mb-3 text-sm text-muted">
          {progresso}
        </p>
      )}

      {cheio ? (
        <p className="text-sm text-muted">
          Chegou ao limite de {MAX_ANEXOS} anexos. Remova algum para colocar outro.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <BotaoAdicionar
              rotulo="Tirar foto agora"
              disabled={ocupado}
              onClick={() => inputCameraRef.current?.click()}
            />
            <BotaoAdicionar
              rotulo="Escolher fotos ou arquivos"
              disabled={ocupado}
              onClick={() => inputArquivoRef.current?.click()}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Fotos, PDF, planilhas e documentos de até {MAX_ANEXO_MB}MB cada.
          </p>
        </>
      )}

      <input
        ref={inputArquivoRef}
        type="file"
        accept={ACCEPT_ANEXOS}
        multiple
        onChange={handleArquivosSelecionados}
        className="hidden"
      />
      <input
        ref={inputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleArquivosSelecionados}
        className="hidden"
      />
    </section>
  );
}

function BotaoAdicionar({
  rotulo,
  disabled,
  onClick,
}: {
  rotulo: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-3.5 text-[15px] font-semibold text-primary hover:border-accent hover:bg-accent/5 disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent"
    >
      {rotulo}
    </button>
  );
}

function Tile({
  anexo,
  confirmando,
  removendo,
  desabilitado,
  onPedirRemocao,
  onCancelar,
  onConfirmar,
}: {
  anexo: Anexo;
  confirmando: boolean;
  removendo: boolean;
  desabilitado: boolean;
  onPedirRemocao: () => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const nome = nomeDoAnexo(anexo.caminho);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-border">
      <a
        href={anexo.url}
        target="_blank"
        rel="noopener noreferrer"
        title={nome}
        className="block h-full w-full hover:opacity-90"
      >
        {ehImagem(anexo.caminho) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anexo.url} alt={nome} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-background p-2 text-center">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {extensaoDe(anexo.caminho).toUpperCase() || "Arquivo"}
            </span>
            <span className="line-clamp-2 break-all text-[11px] leading-tight text-muted">
              {nome}
            </span>
          </span>
        )}
      </a>

      {removendo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs text-muted">
          Removendo...
        </span>
      ) : confirmando ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/90 p-2 text-center">
          <span className="text-xs font-medium text-foreground">Remover?</span>
          <span className="flex gap-1.5">
            <button
              type="button"
              onClick={onConfirmar}
              className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-danger-foreground hover:opacity-90"
            >
              Remover
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-surface-hover"
            >
              Manter
            </button>
          </span>
        </span>
      ) : (
        <button
          type="button"
          onClick={onPedirRemocao}
          disabled={desabilitado}
          aria-label={`Remover ${nome}`}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm shadow-sombra/20 hover:bg-danger hover:text-danger-foreground disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
