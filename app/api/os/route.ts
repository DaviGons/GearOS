import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChecklistInput } from "@/lib/types";
import { erroDeTamanho } from "@/lib/validation";

// GET removido: nada no app consumia esta rota. A busca do quadro é um
// <form method="get"> que recarrega a página, e a listagem vem do server
// component em app/(oficina)/page.tsx. Uma rota que ninguém chama é só
// superfície de ataque a mais.

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = (await request.json().catch(() => null)) as ChecklistInput | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.cliente_nome?.trim() || !body.veiculo_placa?.trim() || !body.observacoes?.trim()) {
    return NextResponse.json(
      { error: "Nome do cliente, placa do veículo e observações são obrigatórios." },
      { status: 400 }
    );
  }

  const excedeu = erroDeTamanho(body as unknown as Record<string, unknown>);
  if (excedeu) return NextResponse.json({ error: excedeu }, { status: 400 });

  const { data, error } = await supabase
    .from("checklists")
    .insert({
      atendente: body.atendente ?? null,
      cliente_nome: body.cliente_nome.trim(),
      cliente_telefone: body.cliente_telefone ?? null,
      cliente_cpf: body.cliente_cpf ?? null,
      cliente_endereco: body.cliente_endereco ?? null,
      cliente_cep: body.cliente_cep ?? null,
      cliente_numero: body.cliente_numero ?? null,
      cliente_complemento: body.cliente_complemento ?? null,
      veiculo_placa: body.veiculo_placa.trim().toUpperCase(),
      veiculo_marca: body.veiculo_marca ?? null,
      veiculo_modelo: body.veiculo_modelo ?? null,
      veiculo_ano: body.veiculo_ano ?? null,
      veiculo_cor: body.veiculo_cor ?? null,
      veiculo_km: body.veiculo_km ?? null,
      veiculo_combustivel: body.veiculo_combustivel ?? null,
      veiculo_tipo_combustivel: body.veiculo_tipo_combustivel ?? null,
      avarias: body.avarias ?? null,
      observacoes: body.observacoes.trim(),
    })
    .select("id")
    .single();

  // a mensagem do Postgres fica no log do servidor: ela descreve colunas e
  // constraints, e isso não precisa chegar ao navegador
  if (error) {
    console.error("POST /api/checklists", error);
    return NextResponse.json({ error: "Não consegui salvar a O.S." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
