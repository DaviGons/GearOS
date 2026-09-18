"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchComRetry } from "@/lib/fetch-retry";
import { Logo } from "../logo";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginTabs />
    </Suspense>
  );
}

function LoginTabs() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"oficina" | "cliente">(
    searchParams.get("portal") ? "cliente" : "oficina"
  );

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="animate-fade-in w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-foreground/5">
        <h1 className="mb-1.5">
          <Logo size="md" />
        </h1>
        <p className="mb-5 text-sm text-muted">
          {tab === "oficina" ? "Entre para acessar o sistema da oficina" : "Acompanhe o seu veículo"}
        </p>

        <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-background p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("oficina")}
            className={`rounded-md py-1.5 font-medium ${
              tab === "oficina" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Sou da oficina
          </button>
          <button
            type="button"
            onClick={() => setTab("cliente")}
            className={`rounded-md py-1.5 font-medium ${
              tab === "cliente" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            Sou cliente
          </button>
        </div>

        {tab === "oficina" ? <OficinaForm /> : <ClienteForm />}
      </div>
    </main>
  );
}

function OficinaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    router.replace(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Senha</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

function ClienteForm() {
  const router = useRouter();
  const [placa, setPlaca] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchComRetry("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, telefone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não consegui encontrar seu veículo.");
      }

      router.replace("/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não consegui encontrar seu veículo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Placa do veículo</span>
        <input
          type="text"
          required
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          placeholder="ABC1D23"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">
          4 últimos dígitos do seu telefone
        </span>
        <input
          type="tel"
          inputMode="numeric"
          required
          maxLength={4}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="0000"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "Buscando..." : "Ver status do veículo"}
      </button>

      <p className="text-center text-xs text-muted">
        Esses dados foram informados por você na recepção da oficina.
      </p>
    </form>
  );
}
