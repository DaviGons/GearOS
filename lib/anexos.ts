import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_ANEXOS = "checklist-fotos";

export const MAX_ANEXOS = 20;
export const MAX_ANEXO_MB = 10;

// Extensões aceitas. É uma lista fechada de propósito: o bucket é servido por
// URL assinada, e um .svg ou .html ali dentro seria uma página executável no
// domínio do Storage. Imagem e documento cobrem o uso real da oficina.
const EXTENSOES_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"];
const EXTENSOES_DOCUMENTO = [
  "pdf", "txt", "csv", "doc", "docx", "xls", "xlsx", "odt", "ods",
  // o iPhone às vezes manda HEIC sem converter; aceitamos para não travar o
  // envio, mas o navegador não desenha essa miniatura — vira cartão de arquivo
  "heic", "heif",
];

export const EXTENSOES_ACEITAS = [...EXTENSOES_IMAGEM, ...EXTENSOES_DOCUMENTO];

export const ACCEPT_ANEXOS = EXTENSOES_ACEITAS.map((e) => `.${e}`).join(",");

export function extensaoDe(caminho: string) {
  const ponto = caminho.lastIndexOf(".");
  return ponto === -1 ? "" : caminho.slice(ponto + 1).toLowerCase();
}

/** Só o que o navegador desenha como miniatura. HEIC de propósito fica de fora. */
export function ehImagem(caminho: string) {
  return EXTENSOES_IMAGEM.includes(extensaoDe(caminho));
}

/**
 * Nome legível a partir do caminho no Storage.
 * Os caminhos têm o formato `<id da O.S.>/<uuid>-<nome do arquivo>`.
 */
export function nomeDoAnexo(caminho: string) {
  const arquivo = caminho.slice(caminho.indexOf("/") + 1);
  const PREFIXO_UUID = 37; // 36 do uuid + o hífen
  const nome = arquivo.slice(PREFIXO_UUID);
  return nome || arquivo;
}

/**
 * Deixa o nome seguro como chave do Storage: sem acento, sem espaço, sem
 * caractere que precise de escape na URL. O Supabase rejeita boa parte deles.
 */
function sanitizarNome(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return (limpo || "arquivo").slice(-80);
}

function caminhoAnexo(checklistId: number, nomeArquivo: string) {
  return `${checklistId}/${crypto.randomUUID()}-${sanitizarNome(nomeArquivo)}`;
}

type ResultadoValidacao = {
  aceitos: File[];
  erro: string | null;
};

export function validarAnexos(
  selecionados: File[],
  jaExistentes: number,
  limite = MAX_ANEXOS
): ResultadoValidacao {
  const aceitos: File[] = [];
  const recusados: string[] = [];

  for (const file of selecionados) {
    if (!EXTENSOES_ACEITAS.includes(extensaoDe(file.name))) {
      recusados.push(`"${file.name}" não é um tipo aceito`);
    } else if (file.size > MAX_ANEXO_MB * 1024 * 1024) {
      recusados.push(`"${file.name}" passa de ${MAX_ANEXO_MB}MB`);
    } else {
      aceitos.push(file);
    }
  }

  const espacoLivre = Math.max(0, limite - jaExistentes);
  if (aceitos.length > espacoLivre) {
    recusados.push(`o limite é de ${limite} arquivos`);
    aceitos.length = espacoLivre;
  }

  return { aceitos, erro: recusados.length > 0 ? `${recusados.join("; ")}.` : null };
}

/**
 * Sobe os arquivos para o Storage, 3 por vez. Devolve os caminhos que deram
 * certo — um arquivo que falha não derruba os outros.
 */
export async function enviarAnexos(
  supabase: SupabaseClient,
  checklistId: number,
  arquivos: File[],
  aoProgredir?: (concluidos: number, total: number) => void
): Promise<{ caminhos: string[]; falhas: string[] }> {
  const CONCORRENCIA = 3;
  const caminhos: (string | null)[] = new Array(arquivos.length).fill(null);
  const falhas: string[] = [];
  const fila = arquivos.map((file, i) => ({ file, i }));
  let concluidos = 0;

  async function worker() {
    for (;;) {
      const item = fila.shift();
      if (!item) return;

      const caminho = caminhoAnexo(checklistId, item.file.name);
      const { error } = await supabase.storage
        .from(BUCKET_ANEXOS)
        .upload(caminho, item.file, { contentType: item.file.type || undefined });

      if (error) falhas.push(item.file.name);
      else caminhos[item.i] = caminho;

      concluidos += 1;
      aoProgredir?.(concluidos, arquivos.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCORRENCIA, arquivos.length) }, worker)
  );

  return { caminhos: caminhos.filter((c): c is string => c !== null), falhas };
}
