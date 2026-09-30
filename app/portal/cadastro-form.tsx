"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrdemDeServico } from "@/lib/types";
import { fetchComRetry } from "@/lib/fetch-retry";

export default function CadastroForm({ os }: { os: OrdemDeServico }) {
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

  const veiculoNome = [os.veiculo_marca, os.veiculo_modelo]
    .filter(Boolean)
    .join(" ") || "veículo";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
        Falta pouco
      </h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Confirme seus dados uma vez e já mostramos como está o seu {veiculoNome}, placa{" "}
        {os.veiculo_placa}.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Field label="Nome completo *">
          <Input name="cliente_nome" required defaultValue={os.cliente_nome} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF *">
            <Input
              name="cliente_cpf"
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              defaultValue={os.cliente_cpf ?? ""}
            />
          </Field>
          <Field label="Telefone com DDD *">
            <Input
              name="cliente_telefone"
              required
              type="tel"
              inputMode="tel"
              placeholder="(11) 91234-5678"
              defaultValue={os.cliente_telefone ?? ""}
            />
          </Field>
        </div>

        <Field label="Endereço (rua) *">
          <Input
            name="cliente_endereco"
            required
            placeholder="Rua, avenida..."
            defaultValue={os.cliente_endereco ?? ""}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="CEP *">
            <Input
              name="cliente_cep"
              required
              inputMode="numeric"
              placeholder="00000-000"
              defaultValue={os.cliente_cep ?? ""}
            />
          </Field>
          <Field label="Número *">
            <Input name="cliente_numero" required defaultValue={os.cliente_numero ?? ""} />
          </Field>
          <Field label="Complemento">
            <Input name="cliente_complemento" defaultValue={os.cliente_complemento ?? ""} />
          </Field>
        </div>

        <p className="text-xs text-muted">
          Depois de salvos, os dados só mudam pela oficina. O telefone passa a ser a sua senha
          para entrar aqui.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar e ver meu carro"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm ${props.className ?? ""}`}
    />
  );
}
