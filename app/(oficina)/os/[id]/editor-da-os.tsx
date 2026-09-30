"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrdemDeServico, Status, STATUS_DICA, STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import { STATUS_BADGE_CLASS, STATUS_DOT_CLASS } from "@/lib/status-style";
import { fetchComRetry } from "@/lib/fetch-retry";
import { Logo } from "../../../logo";
import { Placa } from "../../../placa";
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

function toFields(os: OrdemDeServico): ClienteVeiculoFields {
  return {
    cliente_nome: os.cliente_nome ?? "",
    cliente_telefone: os.cliente_telefone ?? "",
    cliente_cpf: os.cliente_cpf ?? "",
    cliente_endereco: os.cliente_endereco ?? "",
    cliente_cep: os.cliente_cep ?? "",
    cliente_numero: os.cliente_numero ?? "",
    cliente_complemento: os.cliente_complemento ?? "",
    veiculo_placa: os.veiculo_placa ?? "",
    veiculo_marca: os.veiculo_marca ?? "",
    veiculo_modelo: os.veiculo_modelo ?? "",
    veiculo_ano: os.veiculo_ano ?? "",
    veiculo_cor: os.veiculo_cor ?? "",
    veiculo_km: os.veiculo_km ?? "",
    veiculo_combustivel: os.veiculo_combustivel ?? "",
    veiculo_tipo_combustivel: os.veiculo_tipo_combustivel ?? "",
  };
}

// fuso fixo: o HTML sai do servidor em UTC e hidrata no horário do Brasil
const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const HORA = new Intl.DateTimeFormat("pt-BR", {
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function EditorDaOS({
  os,
  anexos,
  fotosPendentes,
}: {
  os: OrdemDeServico;
  anexos: Anexo[];
  fotosPendentes: number;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>(os.status);
  const [fields, setFields] = useState<ClienteVeiculoFields>(() => toFields(os));
  const [avarias, setAvarias] = useState(os.avarias ?? "");
  const [observacoes, setObservacoes] = useState(os.observacoes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialFields = toFields(os);
  const camposDirty = (Object.keys(fields) as (keyof ClienteVeiculoFields)[]).some(
    (key) => fields[key] !== initialFields[key]
  );

  const dirty =
    status !== os.status ||
    avarias !== (os.avarias ?? "") ||
    observacoes !== os.observacoes ||
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
      setError("O nome do cliente e a placa não podem ficar vazios.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetchComRetry(`/api/os/${os.id}`, {
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
        throw new Error(data.error || "Não consegui salvar as alterações.");
      }
      setSavedAt(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não consegui salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  const veiculo = [os.veiculo_marca, os.veiculo_modelo].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6 print:border-0 print:p-0">
        {/* na tela a marca já está na barra lateral; no papel ela é o
            timbrado da O.S., então aparece só na impressão */}
        <span className="mb-3 hidden print:block">
          <Logo size="md" />
        </span>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-none tabular-nums text-foreground">
              O.S. {os.id}
            </h1>
            <p className="mt-2 text-[15px] text-foreground">
              {os.cliente_nome}
              {veiculo && <span className="text-muted">, {veiculo}</span>}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Aberta em {DATA_E_HORA.format(new Date(os.criado_em))}
              {os.atendente && ` por ${os.atendente}`}
            </p>
          </div>
          <Placa placa={os.veiculo_placa} size="lg" className="self-start" />
        </div>

        <div className="mt-6 print:hidden">
          <p className="mb-2 text-sm font-medium text-foreground">Onde o carro está</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_ORDER.map((s) => {
              const ativo = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  disabled={saving}
                  aria-pressed={ativo}
                  className={`rounded-xl border px-3 py-2.5 text-left disabled:cursor-wait ${
                    ativo
                      ? STATUS_BADGE_CLASS[s]
                      : "border-border text-muted hover:border-border-hover hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[s]} ${ativo ? "" : "opacity-50"}`} />
                    {STATUS_LABEL[s]}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug opacity-80">{STATUS_DICA[s]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <span
          className={`mt-4 hidden rounded-full px-3 py-1 text-xs font-medium print:inline-block ${STATUS_BADGE_CLASS[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger print:hidden">
          {error}
        </div>
      )}

      <Bloco titulo="Serviço">
        <EditField label="O que precisa ser feito">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
            className={`${CAMPO} leading-relaxed`}
          />
        </EditField>
        <p className="mt-1.5 text-xs text-muted print:hidden">O cliente também vê este texto no portal.</p>

        <EditField label="Riscos, amassados e avarias" className="mt-4">
          <textarea
            value={avarias}
            onChange={(e) => setAvarias(e.target.value)}
            rows={2}
            placeholder="Nenhuma avaria anotada"
            className={`${CAMPO} leading-relaxed`}
          />
        </EditField>
      </Bloco>

      <Anexos osId={os.id} anexos={anexos} fotosPendentes={fotosPendentes} />

      <Bloco titulo="Cliente">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EditField label="Nome *" className="sm:col-span-2">
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
              placeholder="(11) 91234-5678"
              type="tel"
            />
          </EditField>
          <EditField label="CPF">
            <EditInput
              value={fields.cliente_cpf}
              onChange={(v) => updateField("cliente_cpf", v)}
              placeholder="000.000.000-00"
            />
          </EditField>
          <EditField label="Endereço" className="sm:col-span-2">
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
          <div className="grid grid-cols-2 gap-4">
            <EditField label="Número">
              <EditInput value={fields.cliente_numero} onChange={(v) => updateField("cliente_numero", v)} />
            </EditField>
            <EditField label="Complemento">
              <EditInput
                value={fields.cliente_complemento}
                onChange={(v) => updateField("cliente_complemento", v)}
              />
            </EditField>
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Veículo">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <EditField label="Placa *">
            <EditInput
              value={fields.veiculo_placa}
              onChange={(v) => updateField("veiculo_placa", v.toUpperCase())}
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
          <EditField label="Quilometragem">
            <EditInput value={fields.veiculo_km} onChange={(v) => updateField("veiculo_km", v)} />
          </EditField>
          <EditField label="Nível do tanque">
            <select
              value={fields.veiculo_combustivel}
              onChange={(e) => updateField("veiculo_combustivel", e.target.value)}
              className={CAMPO}
            >
              <option value="">Não anotado</option>
              <option value="Reserva">Reserva</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="3/4">3/4</option>
              <option value="Cheio">Cheio</option>
            </select>
          </EditField>
          <EditField label="Combustível">
            <select
              value={fields.veiculo_tipo_combustivel}
              onChange={(e) => updateField("veiculo_tipo_combustivel", e.target.value)}
              className={CAMPO}
            >
              <option value="">Não anotado</option>
              <option value="gasolina">Gasolina</option>
              <option value="alcool">Álcool</option>
              <option value="diesel">Diesel</option>
            </select>
          </EditField>
        </div>
      </Bloco>

      {/* a barra acompanha a rolagem: numa O.S. comprida, o botão de salvar
          nunca fica três telas abaixo da última coisa que se editou */}
      <div
        className={`sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-sombra/10 print:hidden ${
          dirty ? "border-primary/30 bg-surface" : "border-border bg-surface/95"
        }`}
      >
        <p role="status" className="text-sm text-muted">
          {saving
            ? "Salvando..."
            : dirty
              ? "Tem alteração sem salvar"
              : savedAt
                ? `Salvo às ${HORA.format(savedAt)}`
                : `Última alteração em ${DATA_E_HORA.format(new Date(os.atualizado_em))}`}
        </p>
        <button
          type="button"
          onClick={() => save()}
          disabled={!dirty || saving}
          className="whitespace-nowrap rounded-xl bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          Salvar alterações
        </button>
      </div>

      <footer className="hidden grid-cols-2 gap-8 pt-10 text-xs text-muted print:grid">
        <div className="border-t border-border pt-2">Assinatura do cliente</div>
        <div className="border-t border-border pt-2">Assinatura do atendente</div>
      </footer>
    </div>
  );
}

// 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo
const CAMPO =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm print:border-0 print:bg-transparent print:px-0";

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 print:border-0 print:p-0">
      <h2 className="mb-4 font-display text-xl font-semibold leading-tight text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function EditField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
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
  type,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className={`${CAMPO} ${className ?? ""}`}
    />
  );
}
