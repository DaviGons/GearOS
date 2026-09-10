"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MAX_FOTOS = 8;
const MAX_TAMANHO_MB = 10;

export default function NovoChecklistPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(e.target.files ?? []);
    if (selecionados.length === 0) return;

    const grandeDemais = selecionados.find((f) => f.size > MAX_TAMANHO_MB * 1024 * 1024);
    if (grandeDemais) {
      setError(`"${grandeDemais.name}" passa de ${MAX_TAMANHO_MB}MB.`);
    } else {
      setError(null);
    }

    setFotos((prev) => [...prev, ...selecionados].slice(0, MAX_FOTOS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const cliente_nome = String(form.get("cliente_nome") || "").trim();
    const veiculo_placa = String(form.get("veiculo_placa") || "").trim();
    const observacoes = String(form.get("observacoes") || "").trim();

    if (!cliente_nome || !veiculo_placa || !observacoes) {
      setError("Preencha nome do cliente, placa do veículo e o que precisa ser feito.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atendente: form.get("atendente") || undefined,
          cliente_nome,
          cliente_telefone: form.get("cliente_telefone") || undefined,
          cliente_cpf: form.get("cliente_cpf") || undefined,
          cliente_cep: form.get("cliente_cep") || undefined,
          cliente_numero: form.get("cliente_numero") || undefined,
          cliente_complemento: form.get("cliente_complemento") || undefined,
          veiculo_placa,
          veiculo_marca: form.get("veiculo_marca") || undefined,
          veiculo_modelo: form.get("veiculo_modelo") || undefined,
          veiculo_ano: form.get("veiculo_ano") || undefined,
          veiculo_cor: form.get("veiculo_cor") || undefined,
          veiculo_km: form.get("veiculo_km") || undefined,
          veiculo_combustivel: form.get("veiculo_combustivel") || undefined,
          veiculo_tipo_combustivel: form.get("veiculo_tipo_combustivel") || undefined,
          avarias: form.get("avarias") || undefined,
          observacoes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar checklist.");
      }

      const data = await res.json();

      if (fotos.length > 0) {
        setUploadStatus(`Enviando fotos (0/${fotos.length})...`);
        const supabase = createClient();
        const caminhos: string[] = [];

        for (let i = 0; i < fotos.length; i++) {
          const file = fotos[i];
          const caminho = `${data.id}/${crypto.randomUUID()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("checklist-fotos")
            .upload(caminho, file);

          if (!uploadError) caminhos.push(caminho);
          setUploadStatus(`Enviando fotos (${i + 1}/${fotos.length})...`);
        }

        if (caminhos.length > 0) {
          await fetch(`/api/checklists/${data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fotos: caminhos }),
          });
        }
      }

      router.push(`/checklists/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar checklist.");
      setSaving(false);
      setUploadStatus(null);
    }
  }

  return (
    <main className="animate-fade-in flex-1 mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastrar Entrada</h1>
          <p className="text-sm text-muted">Preencha os dados na recepção do veículo</p>
        </div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Section title="Atendimento">
          <Field label="Atendente / recepcionista">
            <Input name="atendente" placeholder="Seu nome" />
          </Field>
        </Section>

        <Section title="Dados do cliente">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome completo *">
              <Input name="cliente_nome" required placeholder="Nome completo" />
            </Field>
            <Field label="Telefone">
              <Input name="cliente_telefone" placeholder="(00) 00000-0000" />
            </Field>
            <Field label="CPF">
              <Input name="cliente_cpf" placeholder="000.000.000-00" />
            </Field>
            <Field label="CEP">
              <Input name="cliente_cep" placeholder="00000-000" />
            </Field>
            <Field label="Número">
              <Input name="cliente_numero" placeholder="Nº" />
            </Field>
            <Field label="Complemento">
              <Input name="cliente_complemento" placeholder="Apto, bloco, referência..." />
            </Field>
          </div>
        </Section>

        <Section title="Dados do veículo">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Placa *">
              <Input name="veiculo_placa" required placeholder="ABC1D23" className="uppercase" />
            </Field>
            <Field label="Marca">
              <Input name="veiculo_marca" placeholder="Ex: Fiat" />
            </Field>
            <Field label="Modelo">
              <Input name="veiculo_modelo" placeholder="Ex: Uno" />
            </Field>
            <Field label="Ano">
              <Input name="veiculo_ano" placeholder="Ex: 2018" />
            </Field>
            <Field label="Cor">
              <Input name="veiculo_cor" placeholder="Ex: Prata" />
            </Field>
            <Field label="KM atual">
              <Input name="veiculo_km" placeholder="Ex: 85.000" />
            </Field>
            <Field label="Nível do tanque">
              <select
                name="veiculo_combustivel"
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">—</option>
                <option value="Reserva">Reserva</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Cheio">Cheio</option>
              </select>
            </Field>
            <Field label="Tipo de combustível">
              <select
                name="veiculo_tipo_combustivel"
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">—</option>
                <option value="diesel">Diesel</option>
                <option value="alcool">Álcool</option>
                <option value="gasolina">Gasolina</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Fotos do veículo (opcional)">
          <p className="mb-3 text-xs text-muted">
            Registre o estado atual do veículo — ajuda a evitar contestações do cliente depois.
            Até {MAX_FOTOS} fotos, {MAX_TAMANHO_MB}MB cada.
          </p>

          {fotos.length > 0 && (
            <div className="mb-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {fotos.map((file, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFoto(i)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100"
                    aria-label={`Remover ${file.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {fotos.length < MAX_FOTOS && (
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted hover:border-accent hover:text-accent">
              + Adicionar fotos
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFilesSelected}
                className="hidden"
              />
            </label>
          )}
        </Section>

        <Section title="Avarias / riscos visíveis">
          <textarea
            name="avarias"
            rows={2}
            placeholder="Ex: risco na porta traseira esquerda, para-choque amassado..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Section>

        <Section title="O que precisa ser feito *">
          <textarea
            name="observacoes"
            required
            rows={4}
            placeholder="Descreva o serviço solicitado pelo cliente..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Section>

        <div className="flex items-center justify-end gap-3">
          {uploadStatus && <p className="text-xs text-muted">{uploadStatus}</p>}
          <Link
            href="/"
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar checklist"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${props.className ?? ""}`}
    />
  );
}
