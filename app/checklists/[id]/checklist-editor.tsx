"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checklist, STATUS_LABEL, Status, TIPO_COMBUSTIVEL_LABEL } from "@/lib/types";
import { STATUS_BADGE_CLASS } from "@/lib/status-style";

export default function ChecklistEditor({
  checklist,
  fotoUrls,
}: {
  checklist: Checklist;
  fotoUrls: string[];
}) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>(checklist.status);
  const [avarias, setAvarias] = useState(checklist.avarias ?? "");
  const [observacoes, setObservacoes] = useState(checklist.observacoes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    status !== checklist.status ||
    avarias !== (checklist.avarias ?? "") ||
    observacoes !== checklist.observacoes;

  async function handleStatusChange(newStatus: Status) {
    setStatus(newStatus);
    await save({ status: newStatus });
  }

  async function save(overrides?: Partial<{ status: Status }>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/checklists/${checklist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: overrides?.status ?? status,
          avarias,
          observacoes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar alterações.");
      }
      setSavedAt(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in rounded-lg border border-border bg-surface p-6 shadow-sm print:border-0 print:shadow-none print:p-0">
      <header className="mb-6 flex items-start justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ordem de Serviço</h1>
          <p className="text-sm text-muted">GearOS — Oficina Mecânica</p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>#{checklist.id}</p>
          <p>Aberta em {new Date(checklist.criado_em).toLocaleString("pt-BR")}</p>
          {checklist.atendente && <p>Atendente: {checklist.atendente}</p>}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-xs font-medium text-muted mr-1">Status:</span>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            disabled={saving}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === s
                ? STATUS_BADGE_CLASS[s]
                : "border-border text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <span
        className={`hidden print:inline-block mb-4 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
      >
        {STATUS_LABEL[status]}
      </span>

      <Grid title="Cliente">
        <Info label="Nome" value={checklist.cliente_nome} />
        <Info label="Telefone" value={checklist.cliente_telefone} />
        <Info label="CPF" value={checklist.cliente_cpf} />
        <Info label="CEP" value={checklist.cliente_cep} />
        <Info label="Número" value={checklist.cliente_numero} />
        <Info label="Complemento" value={checklist.cliente_complemento} />
      </Grid>

      <Grid title="Veículo">
        <Info label="Placa" value={checklist.veiculo_placa} />
        <Info label="Marca" value={checklist.veiculo_marca} />
        <Info label="Modelo" value={checklist.veiculo_modelo} />
        <Info label="Ano" value={checklist.veiculo_ano} />
        <Info label="Cor" value={checklist.veiculo_cor} />
        <Info label="KM" value={checklist.veiculo_km} />
        <Info label="Combustível (nível)" value={checklist.veiculo_combustivel} />
        <Info
          label="Tipo de combustível"
          value={
            checklist.veiculo_tipo_combustivel
              ? TIPO_COMBUSTIVEL_LABEL[checklist.veiculo_tipo_combustivel]
              : null
          }
        />
      </Grid>

      {fotoUrls.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Fotos do veículo</h2>
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

      <section className="mb-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Avarias / riscos visíveis</h2>
        <textarea
          value={avarias}
          onChange={(e) => setAvarias(e.target.value)}
          rows={2}
          placeholder="Nenhuma avaria registrada"
          className="w-full whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 print:border-0 print:bg-transparent"
        />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-foreground">O que precisa ser feito</h2>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={4}
          className="w-full whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 print:border-0 print:bg-transparent"
        />
      </section>

      <div className="mt-4 flex items-center justify-between print:hidden">
        <p className="text-xs text-muted">
          {error ? (
            <span className="text-danger">{error}</span>
          ) : saving ? (
            "Salvando..."
          ) : savedAt ? (
            `Salvo às ${savedAt.toLocaleTimeString("pt-BR")}`
          ) : (
            `Última atualização: ${new Date(checklist.atualizado_em).toLocaleString("pt-BR")}`
          )}
        </p>
        <button
          type="button"
          onClick={() => save()}
          disabled={!dirty || saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md disabled:opacity-40 disabled:shadow-none"
        >
          Salvar alterações
        </button>
      </div>

      <footer className="mt-10 grid grid-cols-2 gap-8 text-xs text-muted">
        <div className="border-t border-border pt-2">Assinatura do cliente</div>
        <div className="border-t border-border pt-2">Assinatura do atendente</div>
      </footer>
    </div>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
    </section>
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
