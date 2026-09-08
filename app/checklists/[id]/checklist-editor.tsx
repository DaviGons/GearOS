"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checklist, STATUS_LABEL, Status, TIPO_COMBUSTIVEL_LABEL } from "@/lib/types";

const STATUS_STYLE: Record<Status, string> = {
  aberta: "bg-amber-100 text-amber-800 border-amber-200",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-200",
  concluida: "bg-green-100 text-green-800 border-green-200",
};

export default function ChecklistEditor({ checklist }: { checklist: Checklist }) {
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
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none print:p-0">
      <header className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ordem de Serviço</h1>
          <p className="text-sm text-slate-500">GearOS — Oficina Mecânica</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>#{checklist.id}</p>
          <p>Aberta em {new Date(checklist.criado_em).toLocaleString("pt-BR")}</p>
          {checklist.atendente && <p>Atendente: {checklist.atendente}</p>}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            disabled={saving}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              status === s ? STATUS_STYLE[s] : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <span
        className={`hidden print:inline-block mb-4 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}
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

      <section className="mb-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Avarias / riscos visíveis</h2>
        <textarea
          value={avarias}
          onChange={(e) => setAvarias(e.target.value)}
          rows={2}
          placeholder="Nenhuma avaria registrada"
          className="w-full whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none print:border-0"
        />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-700">O que precisa ser feito</h2>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={4}
          className="w-full whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none print:border-0"
        />
      </section>

      <div className="mt-4 flex items-center justify-between print:hidden">
        <p className="text-xs text-slate-400">
          {error ? (
            <span className="text-red-600">{error}</span>
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-40"
        >
          Salvar alterações
        </button>
      </div>

      <footer className="mt-10 grid grid-cols-2 gap-8 text-xs text-slate-500">
        <div className="border-t border-slate-300 pt-2">Assinatura do cliente</div>
        <div className="border-t border-slate-300 pt-2">Assinatura do atendente</div>
      </footer>
    </div>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}
