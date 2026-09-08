import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChecklistInput } from "@/lib/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q = request.nextUrl.searchParams.get("q")?.trim();

  let query = supabase
    .from("checklists")
    .select("*")
    .order("id", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(
      `cliente_nome.ilike.%${q}%,veiculo_placa.ilike.%${q}%,veiculo_modelo.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = (await request.json()) as ChecklistInput;

  if (!body.cliente_nome?.trim() || !body.veiculo_placa?.trim() || !body.observacoes?.trim()) {
    return NextResponse.json(
      { error: "Nome do cliente, placa do veículo e observações são obrigatórios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("checklists")
    .insert({
      atendente: body.atendente ?? null,
      cliente_nome: body.cliente_nome.trim(),
      cliente_telefone: body.cliente_telefone ?? null,
      cliente_cpf: body.cliente_cpf ?? null,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
