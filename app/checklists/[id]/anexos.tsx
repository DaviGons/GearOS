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
  checklistId,
  anexos,
}: {
  checklistId: number;
  anexos: Anexo[];
}) {
  const router = useRouter();
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const cheio = anexos.length >= MAX_ANEXOS;
  const ocupado = enviando || removendo !== null;

  /** Grava a nova lista de caminhos na O.S. e recarrega os dados da página. */
  async function salvarLista(caminhos: string[]) {
    const res = await fetchComRetry(`/api/checklists/${checklistId}`, {
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
    setProgresso(`Enviando (0/${aceitos.length})...`);

    try {
      const supabase = createClient();
      const { caminhos, falhas } = await enviarAnexos(
        supabase,
        checklistId,
        aceitos,
        (feitos, total) => setProgresso(`Enviando (${feitos}/${total})...`)
      );

      if (caminhos.length > 0) {
        setProgresso("Salvando...");
        await salvarLista([...anexos.map((a) => a.caminho), ...caminhos]);
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
    <section className="mb-5 print:hidden">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Fotos e arquivos</h2>
        <span className="text-xs text-muted">
          {anexos.length}/{MAX_ANEXOS} · até {MAX_ANEXO_MB}MB cada
        </span>
      </div>

      {erro && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {erro}
        </div>
      )}

      {anexos.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
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

      {enviando && <p className="mb-3 text-xs text-muted">{progresso}</p>}

      {cheio ? (
        <p className="text-xs text-muted">
          Limite de {MAX_ANEXOS} anexos atingido. Remova algum para adicionar outro.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <BotaoAdicionar
            rotulo="+ Adicionar fotos ou arquivos"
            disabled={ocupado}
            onClick={() => inputArquivoRef.current?.click()}
          />
          <BotaoAdicionar
            rotulo="Tirar foto agora"
            disabled={ocupado}
            onClick={() => inputCameraRef.current?.click()}
          />
        </div>
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
      className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
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
    <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
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
            <span className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">
              {extensaoDe(anexo.caminho) || "arquivo"}
            </span>
            <span className="line-clamp-2 break-all text-[10px] leading-tight text-muted">
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
          <span className="text-[11px] text-foreground">Remover?</span>
          <span className="flex gap-1.5">
            <button
              type="button"
              onClick={onConfirmar}
              className="rounded bg-danger px-2 py-1 text-[11px] font-semibold text-danger-foreground hover:opacity-90"
            >
              Sim
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="rounded border border-border px-2 py-1 text-[11px] text-foreground hover:bg-surface-hover"
            >
              Não
            </button>
          </span>
        </span>
      ) : (
        <button
          type="button"
          onClick={onPedirRemocao}
          disabled={desabilitado}
          aria-label={`Remover ${nome}`}
          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-danger hover:text-danger-foreground disabled:opacity-30"
        >
          ✕
        </button>
      )}
    </div>
  );
}
