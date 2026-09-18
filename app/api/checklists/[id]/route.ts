import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STATUS_ORDER, Status, TipoCombustivel } from "@/lib/types";
import { BUCKET_ANEXOS, EXTENSOES_ACEITAS, MAX_ANEXOS, extensaoDe } from "@/lib/anexos";
import { erroDeTamanho } from "@/lib/validation";

const TIPOS_COMBUSTIVEL: TipoCombustivel[] = ["diesel", "alcool", "gasolina"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Checklist não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

type PatchBody = {
  status?: Status;
  observacoes?: string;
  avarias?: string | null;
  fotos?: string[];

  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  cliente_endereco?: string;
  cliente_cep?: string;
  cliente_numero?: string;
  cliente_complemento?: string;

  veiculo_placa?: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: string;
  veiculo_cor?: string;
  veiculo_km?: string;
  veiculo_combustivel?: string;
  veiculo_tipo_combustivel?: string;
};

// campos opcionais: string vazia vira null, texto normal só recebe trim
const CAMPOS_TEXTO_OPCIONAL = [
  "cliente_telefone",
  "cliente_cpf",
  "cliente_endereco",
  "cliente_cep",
  "cliente_numero",
  "cliente_complemento",
  "veiculo_marca",
  "veiculo_modelo",
  "veiculo_ano",
  "veiculo_cor",
  "veiculo_km",
  "veiculo_combustivel",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const excedeu = erroDeTamanho(body as unknown as Record<string, unknown>);
  if (excedeu) return NextResponse.json({ error: excedeu }, { status: 400 });

  const update: Record<string, unknown> = {};

  // O banco tem CHECK nesta coluna, mas sem conferir aqui um status inválido
  // só viraria erro 500 lá no Postgres — e com a mensagem dele vazando junto.
  if (body.status !== undefined) {
    if (!STATUS_ORDER.includes(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.observacoes !== undefined) update.observacoes = body.observacoes.trim();
  if (body.avarias !== undefined) update.avarias = body.avarias;

  if (body.fotos !== undefined) {
    if (
      !Array.isArray(body.fotos) ||
      body.fotos.some((caminho) => typeof caminho !== "string")
    ) {
      return NextResponse.json({ error: "Lista de anexos inválida." }, { status: 400 });
    }
    if (body.fotos.length > MAX_ANEXOS) {
      return NextResponse.json(
        { error: `No máximo ${MAX_ANEXOS} anexos por O.S.` },
        { status: 400 }
      );
    }
    // Todo anexo mora na pasta da própria O.S. Sem esta checagem, daria para
    // pendurar nesta O.S. o arquivo de outra — ou remover o arquivo alheio no
    // momento em que ele saísse da lista.
    if (body.fotos.some((caminho) => !caminho.startsWith(`${id}/`))) {
      return NextResponse.json({ error: "Anexo fora desta O.S." }, { status: 400 });
    }
    // A lista de extensões do lib/anexos.ts só valia no navegador: o upload
    // vai do browser direto para o Storage, então dava para subir um .svg por
    // fora e pendurar aqui. Um .svg é uma página executável servida pelo
    // domínio do Storage — não entra na O.S.
    const proibido = body.fotos.find(
      (caminho) => !EXTENSOES_ACEITAS.includes(extensaoDe(caminho))
    );
    if (proibido) {
      return NextResponse.json(
        { error: "Tipo de arquivo não aceito como anexo." },
        { status: 400 }
      );
    }
    update.fotos = body.fotos;
  }

  if (body.cliente_nome !== undefined) {
    if (!body.cliente_nome.trim()) {
      return NextResponse.json({ error: "Nome do cliente não pode ficar vazio." }, { status: 400 });
    }
    update.cliente_nome = body.cliente_nome.trim();
  }

  if (body.veiculo_placa !== undefined) {
    if (!body.veiculo_placa.trim()) {
      return NextResponse.json({ error: "Placa do veículo não pode ficar vazia." }, { status: 400 });
    }
    update.veiculo_placa = body.veiculo_placa.trim().toUpperCase();
  }

  for (const campo of CAMPOS_TEXTO_OPCIONAL) {
    const valor = body[campo];
    if (valor !== undefined) update[campo] = valor.trim() || null;
  }

  if (body.veiculo_tipo_combustivel !== undefined) {
    const valor = body.veiculo_tipo_combustivel.trim();
    if (valor && !TIPOS_COMBUSTIVEL.includes(valor as TipoCombustivel)) {
      return NextResponse.json({ error: "Tipo de combustível inválido." }, { status: 400 });
    }
    update.veiculo_tipo_combustivel = valor || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  // a lista atual é lida antes para descobrir quais arquivos ficaram órfãos
  const anteriores =
    body.fotos === undefined
      ? []
      : ((await supabase.from("checklists").select("fotos").eq("id", id).maybeSingle()).data
          ?.fotos as string[] | undefined) ?? [];

  const { data, error } = await supabase
    .from("checklists")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/checklists/[id]", error);
    return NextResponse.json({ error: "Não consegui salvar as alterações." }, { status: 500 });
  }

  // mesmo caso do DELETE: zero linhas atualizadas não é erro no banco, mas
  // também não é sucesso do ponto de vista de quem chamou
  if (!data) {
    return NextResponse.json({ error: "Checklist não encontrado." }, { status: 404 });
  }

  // Só depois de a gravação dar certo: o que saiu da lista é apagado do bucket,
  // senão sobraria arquivo pago ocupando espaço sem nada apontando para ele.
  const removidos = anteriores.filter((caminho) => !data.fotos.includes(caminho));
  if (removidos.length > 0) {
    await supabase.storage.from(BUCKET_ANEXOS).remove(removidos);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("checklists")
    .select("fotos")
    .eq("id", id)
    .single();

  // A linha sai primeiro. Antes os arquivos eram apagados antes do DELETE, e
  // se o DELETE falhasse (ou a RLS barrasse) a O.S. continuava no quadro com
  // as fotos já destruídas — perda de dado sem volta em troca de nada.
  const { data: apagadas, error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("DELETE /api/checklists/[id]", error);
    return NextResponse.json({ error: "Não consegui excluir a O.S." }, { status: 500 });
  }

  // Um delete que não encontra a linha (id inexistente, ou bloqueado pelas
  // policies de RLS por falta de sessão) não é erro no Postgres: ele afeta
  // zero linhas e volta "sucesso". Sem conferir isso aqui, a rota responderia
  // ok para uma exclusão que nunca aconteceu.
  if (!apagadas || apagadas.length === 0) {
    return NextResponse.json({ error: "Checklist não encontrado." }, { status: 404 });
  }

  if (row?.fotos?.length) {
    await supabase.storage.from(BUCKET_ANEXOS).remove(row.fotos);
  }

  return NextResponse.json({ ok: true });
}
