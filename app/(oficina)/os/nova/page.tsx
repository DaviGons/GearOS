"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchComRetry } from "@/lib/fetch-retry";
import {
  BUCKET_ANEXOS,
  MAX_ANEXO_MB,
  ehImagem,
  enviarAnexos,
  extensaoDe,
  validarAnexos,
} from "@/lib/anexos";
import { Placa } from "../../../placa";

const MAX_FOTOS = 8;

/** A foto escolhida e a URL local da miniatura, criada uma vez só. */
type FotoSelecionada = { file: File; preview: string };

export default function ReceberVeiculoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
  const [placa, setPlaca] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cada miniatura é um blob: na memória até alguém liberar. Antes a URL era
  // criada a cada renderização e nunca liberada — digitar no formulário com 8
  // fotos escolhidas empilhava cópias delas na memória do celular.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const abertas = previews.current;
    return () => abertas.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (selecionados.length === 0) return;

    const { aceitos, erro } = validarAnexos(selecionados, fotos.length, MAX_FOTOS);
    setError(erro);
    const novas = aceitos.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { file, preview };
    });
    setFotos((prev) => [...prev, ...novas]);
  }

  function removeFoto(foto: FotoSelecionada) {
    URL.revokeObjectURL(foto.preview);
    previews.current.delete(foto.preview);
    setFotos((prev) => prev.filter((f) => f !== foto));
  }

  /**
   * Sobe as fotos e liga os caminhos à O.S. recém-criada. Devolve quantas
   * ficaram de fora. Nunca lança: a O.S. já existe, e o que falhar aqui vira
   * aviso na tela dela, não erro no formulário.
   */
  async function anexarFotos(id: number): Promise<number> {
    const supabase = createClient();
    let enviados: string[] = [];

    try {
      const { caminhos, falhas } = await enviarAnexos(
        supabase,
        id,
        fotos.map((f) => f.file),
        (feitas, total) => setUploadStatus(`Enviando fotos (${feitas} de ${total})`)
      );
      enviados = caminhos;
      if (caminhos.length === 0) return fotos.length;

      setUploadStatus("Guardando as fotos na O.S.");
      const res = await fetchComRetry(`/api/os/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotos: caminhos }),
      });
      if (!res.ok) throw new Error();

      return falhas.length;
    } catch {
      // Os arquivos subiram mas a O.S. não ficou sabendo deles: ninguém ia
      // encontrá-los nem apagá-los depois. Sai tudo do bucket, e a tela da
      // O.S. pede para anexar de novo.
      if (enviados.length > 0) {
        await supabase.storage.from(BUCKET_ANEXOS).remove(enviados);
      }
      return fotos.length;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const cliente_nome = String(form.get("cliente_nome") || "").trim();
    const veiculo_placa = String(form.get("veiculo_placa") || "").trim();
    const observacoes = String(form.get("observacoes") || "").trim();

    if (!cliente_nome || !veiculo_placa || !observacoes) {
      setError("Preencha o nome do cliente, a placa e o que precisa ser feito.");
      return;
    }

    setSaving(true);
    setUploadStatus("Abrindo a O.S.");

    let id: number;
    try {
      const res = await fetchComRetry("/api/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atendente: form.get("atendente") || undefined,
          cliente_nome,
          cliente_telefone: form.get("cliente_telefone") || undefined,
          cliente_cpf: form.get("cliente_cpf") || undefined,
          cliente_endereco: form.get("cliente_endereco") || undefined,
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
        throw new Error(data.error || "Não consegui abrir a O.S. Tente de novo.");
      }

      id = (await res.json()).id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não consegui abrir a O.S. Tente de novo.");
      setSaving(false);
      setUploadStatus(null);
      return;
    }

    // Daqui em diante a O.S. existe. Voltar para o formulário com um erro
    // levaria a um segundo "Abrir O.S." — e a uma O.S. repetida no quadro.
    const pendentes = fotos.length > 0 ? await anexarFotos(id) : 0;
    router.push(
      pendentes > 0 ? `/os/${id}?fotos_pendentes=${pendentes}` : `/os/${id}`
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-9">
      <Link
        href="/"
        className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
        Quadro
      </Link>

      <header className="mb-6 mt-2">
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
          Receber veículo
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Anote o que o cliente contou e como o carro chegou. Só os campos com asterisco são
          obrigatórios.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Section title="Cliente" dica="O telefone é a senha do cliente para acompanhar o carro pelo portal.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome completo *" className="sm:col-span-2">
              <Input name="cliente_nome" required autoComplete="off" />
            </Field>
            <Field label="Telefone com DDD">
              <Input name="cliente_telefone" type="tel" inputMode="tel" placeholder="(11) 91234-5678" />
            </Field>
            <Field label="CPF">
              <Input name="cliente_cpf" inputMode="numeric" placeholder="000.000.000-00" />
            </Field>
            <Field label="Endereço" className="sm:col-span-2">
              <Input name="cliente_endereco" placeholder="Rua, avenida..." />
            </Field>
            <Field label="CEP">
              <Input name="cliente_cep" inputMode="numeric" placeholder="00000-000" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Número">
                <Input name="cliente_numero" />
              </Field>
              <Field label="Complemento">
                <Input name="cliente_complemento" placeholder="Apto, bloco" />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Veículo">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field label="Placa *" className="sm:w-48">
              <Input
                name="veiculo_placa"
                required
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
                placeholder="ABC1D23"
                className="uppercase"
              />
            </Field>
            <Placa
              placa={placa.trim() || "ABC1D23"}
              size="md"
              className={placa.trim() ? "" : "opacity-35"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Marca">
              <Input name="veiculo_marca" placeholder="Fiat" />
            </Field>
            <Field label="Modelo">
              <Input name="veiculo_modelo" placeholder="Uno" />
            </Field>
            <Field label="Ano">
              <Input name="veiculo_ano" inputMode="numeric" placeholder="2018" />
            </Field>
            <Field label="Cor">
              <Input name="veiculo_cor" placeholder="Prata" />
            </Field>
            <Field label="Quilometragem">
              <Input name="veiculo_km" inputMode="numeric" placeholder="85.000" />
            </Field>
            <Field label="Nível do tanque">
              <Select name="veiculo_combustivel">
                <option value="">Não anotado</option>
                <option value="Reserva">Reserva</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Cheio">Cheio</option>
              </Select>
            </Field>
            <Field label="Combustível">
              <Select name="veiculo_tipo_combustivel">
                <option value="">Não anotado</option>
                <option value="gasolina">Gasolina</option>
                <option value="alcool">Álcool</option>
                <option value="diesel">Diesel</option>
              </Select>
            </Field>
          </div>
        </Section>

        <Section
          title="Como o carro chegou"
          dica="Foto de cada lado e dos riscos evita discussão na hora da entrega."
        >
          {fotos.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fotos.map((foto) => (
                <div
                  key={foto.preview}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background"
                >
                  {ehImagem(foto.file.name) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto.preview} alt={foto.file.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-muted">
                      {extensaoDe(foto.file.name).toUpperCase()}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFoto(foto)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm shadow-sombra/20 hover:bg-danger hover:text-danger-foreground"
                    aria-label={`Tirar ${foto.file.name}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {fotos.length < MAX_FOTOS ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-border px-4 py-5 text-center hover:border-accent hover:bg-accent/5 focus-within:border-accent">
              <span className="text-[15px] font-semibold text-primary">Tirar ou escolher fotos</span>
              <span className="text-xs text-muted">
                Até {MAX_FOTOS} fotos de {MAX_ANEXO_MB}MB. Dá para anexar mais depois, na O.S.
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="sr-only"
              />
            </label>
          ) : (
            <p className="text-sm text-muted">
              Chegou ao limite de {MAX_FOTOS} fotos. As outras dá para anexar na tela da O.S.
            </p>
          )}

          <Field label="Riscos, amassados e avarias" className="mt-4">
            <Textarea
              name="avarias"
              rows={2}
              placeholder="Risco na porta traseira esquerda, para-choque amassado..."
            />
          </Field>
        </Section>

        <Section title="Serviço">
          <Field label="O que precisa ser feito *">
            <Textarea
              name="observacoes"
              required
              rows={4}
              placeholder="O que o cliente pediu, com as palavras dele. O cliente também vê este texto no portal."
            />
          </Field>
          <Field label="Quem está recebendo" className="mt-4 sm:w-1/2">
            <Input name="atendente" placeholder="Seu nome" />
          </Field>
        </Section>

        <div className="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          {uploadStatus && (
            <p role="status" className="text-center text-sm text-muted sm:mr-auto sm:text-left">
              {uploadStatus}
            </p>
          )}
          <Link
            href="/"
            className="rounded-xl border border-border bg-surface px-5 py-3 text-center text-[15px] font-medium text-foreground hover:bg-surface-hover"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground shadow-sm shadow-sombra/10 hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Abrindo..." : "Abrir O.S."}
          </button>
        </div>
      </form>
    </main>
  );
}

function Section({
  title,
  dica,
  children,
}: {
  title: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold leading-tight text-foreground">{title}</h2>
      {dica && <p className="mt-0.5 text-sm text-muted">{dica}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
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

// 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo
const CAMPO =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:text-sm";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CAMPO} ${props.className ?? ""}`} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CAMPO} leading-relaxed ${props.className ?? ""}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select defaultValue="" {...props} className={`${CAMPO} ${props.className ?? ""}`} />;
}
