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
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 flex justify-center">
          <Logo size="lg" />
        </h1>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-sombra/5 sm:p-7">
          <div
            role="tablist"
            aria-label="Tipo de acesso"
            className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-background p-1 text-[15px]"
          >
            <Aba ativa={tab === "cliente"} onClick={() => setTab("cliente")}>
              Sou cliente
            </Aba>
            <Aba ativa={tab === "oficina"} onClick={() => setTab("oficina")}>
              Sou da oficina
            </Aba>
          </div>

          <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
            {tab === "oficina" ? "Entrar na oficina" : "Acompanhe seu carro"}
          </h2>
          <p className="mb-5 mt-1 text-sm text-muted">
            {tab === "oficina"
              ? "Use o e-mail e a senha da sua conta na equipe."
              : "Veja em que etapa está o serviço, sem precisar ligar para a oficina."}
          </p>

          {tab === "oficina" ? <OficinaForm /> : <ClienteForm />}
        </div>
      </div>
    </main>
  );
}

function Aba({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativa}
      onClick={onClick}
      className={`rounded-lg py-2 font-semibold ${
        ativa ? "bg-surface text-foreground shadow-sm shadow-sombra/10" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo
const CAMPO =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm";

const BOTAO =
  "w-full rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60";

function Erro({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}

/**
 * O `next` chega pela URL. O proxy só escreve caminhos ali, mas nada impede
 * alguém de mandar /login?next=https://site-falso.com e levar o usuário para
 * fora logo depois de ele digitar a senha. Só caminho interno passa — e `//`
 * fica de fora porque `//site.com` é URL absoluta sem protocolo.
 */
function destinoSeguro(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
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

    router.replace(destinoSeguro(searchParams.get("next")));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Erro>{error}</Erro>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={CAMPO}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Senha</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={CAMPO}
        />
      </label>

      <button type="submit" disabled={loading} className={BOTAO}>
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
      {error && <Erro>{error}</Erro>}

      {/* o campo é a própria placa: quem chega aqui olha para o carro, não
          para um formulário, e reconhece o formato na hora */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Placa do carro</span>
        <span className="flex flex-col overflow-hidden rounded-lg border-2 border-placa-texto/80 bg-placa-fundo focus-within:ring-4 focus-within:ring-accent/30">
          <span
            aria-hidden="true"
            className="flex h-4 items-center justify-center bg-placa-faixa font-display text-[10px] font-semibold tracking-[0.3em] text-white"
          >
            BRASIL
          </span>
          <input
            type="text"
            required
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={8}
            placeholder="ABC1D23"
            className="w-full bg-transparent py-1.5 text-center font-display text-[28px] font-medium uppercase leading-10 tracking-[0.06em] text-placa-texto placeholder:text-placa-texto/25 focus:outline-none"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Últimos 4 números do seu telefone
        </span>
        <input
          type="tel"
          inputMode="numeric"
          required
          maxLength={4}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="0000"
          className={`${CAMPO} text-center text-lg tracking-[0.4em] sm:text-lg`}
        />
        <span className="mt-1.5 block text-xs text-muted">
          O mesmo telefone que você deixou na recepção.
        </span>
      </label>

      <button type="submit" disabled={loading} className={BOTAO}>
        {loading ? "Procurando seu carro..." : "Ver meu carro"}
      </button>
    </form>
  );
}
