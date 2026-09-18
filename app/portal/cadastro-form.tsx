"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checklist } from "@/lib/types";
import { fetchComRetry } from "@/lib/fetch-retry";

export default function CadastroForm({ checklist }: { checklist: Checklist }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetchComRetry("/api/portal/cadastro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nome: form.get("cliente_nome"),
          cliente_cpf: form.get("cliente_cpf"),
          cliente_endereco: form.get("cliente_endereco"),
          cliente_cep: form.get("cliente_cep"),
          cliente_numero: form.get("cliente_numero"),
          cliente_complemento: form.get("cliente_complemento"),
          cliente_telefone: form.get("cliente_telefone"),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar cadastro.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cadastro.");
      setSaving(false);
    }
  }

  const veiculoNome = [checklist.veiculo_marca, checklist.veiculo_modelo]
    .filter(Boolean)
    .join(" ") || "veículo";

  return (
    <div className="animate-fade-in rounded-lg border border-border bg-surface p-6">
      <h1 className="text-xl font-bold text-foreground">Complete seu cadastro</h1>
      <p className="mt-1 text-sm text-muted">
        Antes de ver o status do seu {veiculoNome} (placa {checklist.veiculo_placa}), precisamos
        confirmar seus dados.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <Field label="Nome completo *">
          <Input name="cliente_nome" required defaultValue={checklist.cliente_nome} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF *">
            <Input
              name="cliente_cpf"
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              defaultValue={checklist.cliente_cpf ?? ""}
            />
          </Field>
          <Field label="Telefone com DDD *">
            <Input
              name="cliente_telefone"
              required
              inputMode="numeric"
              placeholder="11922223333"
              defaultValue={checklist.cliente_telefone ?? ""}
            />
          </Field>
        </div>

        <Field label="Endereço (rua) *">
          <Input
            name="cliente_endereco"
            required
            placeholder="Rua, avenida..."
            defaultValue={checklist.cliente_endereco ?? ""}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="CEP *">
            <Input
              name="cliente_cep"
              required
              inputMode="numeric"
              placeholder="00000-000"
              defaultValue={checklist.cliente_cep ?? ""}
            />
          </Field>
          <Field label="Número *">
            <Input name="cliente_numero" required defaultValue={checklist.cliente_numero ?? ""} />
          </Field>
          <Field label="Complemento">
            <Input name="cliente_complemento" defaultValue={checklist.cliente_complemento ?? ""} />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar e continuar"}
        </button>
      </form>
    </div>
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
