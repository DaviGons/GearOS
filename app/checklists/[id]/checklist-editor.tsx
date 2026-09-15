"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checklist, Status, STATUS_LABEL } from "@/lib/types";
import { STATUS_BADGE_CLASS } from "@/lib/status-style";
import { fetchComRetry } from "@/lib/fetch-retry";
import { Logo } from "../../logo";
import Anexos, { type Anexo } from "./anexos";

type ClienteVeiculoFields = {
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string;
  cliente_endereco: string;
  cliente_cep: string;
  cliente_numero: string;
  cliente_complemento: string;
  veiculo_placa: string;
  veiculo_marca: string;
  veiculo_modelo: string;
  veiculo_ano: string;
  veiculo_cor: string;
  veiculo_km: string;
  veiculo_combustivel: string;
  veiculo_tipo_combustivel: string;
};

function toFields(checklist: Checklist): ClienteVeiculoFields {
  return {
    cliente_nome: checklist.cliente_nome ?? "",
    cliente_telefone: checklist.cliente_telefone ?? "",
    cliente_cpf: checklist.cliente_cpf ?? "",
    cliente_endereco: checklist.cliente_endereco ?? "",
    cliente_cep: checklist.cliente_cep ?? "",
    cliente_numero: checklist.cliente_numero ?? "",
    cliente_complemento: checklist.cliente_complemento ?? "",
    veiculo_placa: checklist.veiculo_placa ?? "",
    veiculo_marca: checklist.veiculo_marca ?? "",
    veiculo_modelo: checklist.veiculo_modelo ?? "",
    veiculo_ano: checklist.veiculo_ano ?? "",
    veiculo_cor: checklist.veiculo_cor ?? "",
    veiculo_km: checklist.veiculo_km ?? "",
    veiculo_combustivel: checklist.veiculo_combustivel ?? "",
    veiculo_tipo_combustivel: checklist.veiculo_tipo_combustivel ?? "",
  };
}

export default function ChecklistEditor({
  checklist,
  anexos,
}: {
  checklist: Checklist;
  anexos: Anexo[];
}) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>(checklist.status);
  const [fields, setFields] = useState<ClienteVeiculoFields>(() => toFields(checklist));
  const [avarias, setAvarias] = useState(checklist.avarias ?? "");
  const [observacoes, setObservacoes] = useState(checklist.observacoes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialFields = toFields(checklist);
  const camposDirty = (Object.keys(fields) as (keyof ClienteVeiculoFields)[]).some(
    (key) => fields[key] !== initialFields[key]
  );

  const dirty =
    status !== checklist.status ||
    avarias !== (checklist.avarias ?? "") ||
    observacoes !== checklist.observacoes ||
    camposDirty;

  function updateField<K extends keyof ClienteVeiculoFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleStatusChange(newStatus: Status) {
    setStatus(newStatus);
    await save({ status: newStatus });
  }

  async function save(overrides?: Partial<{ status: Status }>) {
    if (!fields.cliente_nome.trim() || !fields.veiculo_placa.trim()) {
      setError("Nome do cliente e placa do veículo não podem ficar vazios.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetchComRetry(`/api/checklists/${checklist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: overrides?.status ?? status,
          avarias,
          observacoes,
          ...fields,
          cliente_nome: fields.cliente_nome.trim(),
          veiculo_placa: fields.veiculo_placa.trim().toUpperCase(),
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
      <header className="mb-6 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo size="md" />
          <h1 className="mt-1.5 text-lg font-bold text-foreground">Ordem de Serviço</h1>
        </div>
        <div className="text-xs text-muted sm:text-right">
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

      {error && (
        <div className="mb-5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger print:hidden">
          {error}
        </div>
      )}

      <EditGrid title="Cliente">
        <EditField label="Nome *">
          <EditInput
            value={fields.cliente_nome}
            onChange={(v) => updateField("cliente_nome", v)}
            required
          />
        </EditField>
        <EditField label="Telefone">
          <EditInput
            value={fields.cliente_telefone}
            onChange={(v) => updateField("cliente_telefone", v)}
            placeholder="(00) 00000-0000"
          />
        </EditField>
        <EditField label="CPF">
          <EditInput
            value={fields.cliente_cpf}
            onChange={(v) => updateField("cliente_cpf", v)}
            placeholder="000.000.000-00"
          />
        </EditField>
        <EditField label="Endereço">
          <EditInput
            value={fields.cliente_endereco}
            onChange={(v) => updateField("cliente_endereco", v)}
            placeholder="Rua, avenida..."
          />
        </EditField>
        <EditField label="CEP">
          <EditInput
            value={fields.cliente_cep}
            onChange={(v) => updateField("cliente_cep", v)}
            placeholder="00000-000"
          />
        </EditField>
        <EditField label="Número">
          <EditInput value={fields.cliente_numero} onChange={(v) => updateField("cliente_numero", v)} />
        </EditField>
        <EditField label="Complemento">
          <EditInput
            value={fields.cliente_complemento}
            onChange={(v) => updateField("cliente_complemento", v)}
          />
        </EditField>
      </EditGrid>

      <EditGrid title="Veículo">
        <EditField label="Placa *">
          <EditInput
            value={fields.veiculo_placa}
            onChange={(v) => updateField("veiculo_placa", v)}
            required
            className="uppercase"
          />
        </EditField>
        <EditField label="Marca">
          <EditInput value={fields.veiculo_marca} onChange={(v) => updateField("veiculo_marca", v)} />
        </EditField>
        <EditField label="Modelo">
          <EditInput value={fields.veiculo_modelo} onChange={(v) => updateField("veiculo_modelo", v)} />
        </EditField>
        <EditField label="Ano">
          <EditInput value={fields.veiculo_ano} onChange={(v) => updateField("veiculo_ano", v)} />
        </EditField>
        <EditField label="Cor">
          <EditInput value={fields.veiculo_cor} onChange={(v) => updateField("veiculo_cor", v)} />
        </EditField>
        <EditField label="KM">
          <EditInput value={fields.veiculo_km} onChange={(v) => updateField("veiculo_km", v)} />
        </EditField>
        <EditField label="Nível do tanque">
          <select
            value={fields.veiculo_combustivel}
            onChange={(e) => updateField("veiculo_combustivel", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 print:border-0 print:bg-transparent print:px-0"
          >
            <option value="">—</option>
            <option value="Reserva">Reserva</option>
            <option value="1/4">1/4</option>
            <option value="1/2">1/2</option>
            <option value="3/4">3/4</option>
            <option value="Cheio">Cheio</option>
          </select>
        </EditField>
        <EditField label="Tipo de combustível">
          <select
            value={fields.veiculo_tipo_combustivel}
            onChange={(e) => updateField("veiculo_tipo_combustivel", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 print:border-0 print:bg-transparent print:px-0"
          >
            <option value="">—</option>
            <option value="diesel">Diesel</option>
            <option value="alcool">Álcool</option>
            <option value="gasolina">Gasolina</option>
          </select>
        </EditField>
      </EditGrid>

      <Anexos checklistId={checklist.id} anexos={anexos} />

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

      <div className="mt-4 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {saving ? (
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
          className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md disabled:opacity-40 disabled:shadow-none sm:self-auto"
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

function EditGrid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted/70">{label}</span>
      {children}
    </label>
  );
}

function EditInput({
  value,
  onChange,
  required,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 print:border-0 print:bg-transparent print:px-0 ${className ?? ""}`}
    />
  );
}
