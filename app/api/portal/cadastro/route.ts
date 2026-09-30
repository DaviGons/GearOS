import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { PORTAL_COOKIE_NAME, verifyPortalToken } from "@/lib/portal-session";
import { cadastroClienteCompleto, erroDeTamanho, isValidCPF } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { TABELA_OS, type OrdemDeServico } from "@/lib/types";

export async function PATCH(request: NextRequest) {
  if (!checkRateLimit(request, "portal-cadastro", { limit: 20, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  const cookieStore = await cookies();
  const osId = verifyPortalToken(cookieStore.get(PORTAL_COOKIE_NAME)?.value);

  if (!osId) {
    return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const cliente_nome = String(body.cliente_nome || "").trim();
  const cliente_cpf = String(body.cliente_cpf || "").replace(/\D/g, "");
  const cliente_endereco = String(body.cliente_endereco || "").trim();
  const cliente_cep = String(body.cliente_cep || "").replace(/\D/g, "");
  const cliente_numero = String(body.cliente_numero || "").trim();
  const cliente_complemento = String(body.cliente_complemento || "").trim();
  const cliente_telefone = String(body.cliente_telefone || "").replace(/\D/g, "");

  if (!cliente_nome || !cliente_endereco || !cliente_numero) {
    return NextResponse.json({ error: "Preencha nome, endereço e número." }, { status: 400 });
  }
  if (!isValidCPF(cliente_cpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }
  if (cliente_cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }
  if (cliente_telefone.length < 10 || cliente_telefone.length > 11) {
    return NextResponse.json({ error: "Telefone inválido. Use DDD + número." }, { status: 400 });
  }

  // Esta rota grava com a service role, sem RLS por trás: o teto de tamanho
  // dos campos é a única coisa entre o formulário e uma O.S. de megabytes.
  const excedeu = erroDeTamanho({
    cliente_nome,
    cliente_endereco,
    cliente_numero,
    cliente_complemento,
  });
  if (excedeu) return NextResponse.json({ error: excedeu }, { status: 400 });

  const supabase = createAdminClient();

  // O cadastro se preenche uma vez só. Depois disso a tela nem mostra mais o
  // formulário, e a rota precisa dizer o mesmo: o telefone é a senha do
  // portal, então trocá-lo por aqui deixaria quem pegou a sessão emprestada
  // mudar a senha e ficar com o acesso. Dado errado se corrige na oficina.
  const { data: atual } = await supabase
    .from(TABELA_OS)
    .select("cliente_nome, cliente_cpf, cliente_endereco, cliente_cep, cliente_numero, cliente_telefone")
    .eq("id", osId)
    .maybeSingle();

  // a O.S. pode ter sido excluída enquanto o cliente estava com a tela aberta
  if (!atual) {
    return NextResponse.json(
      { error: "Esta ordem de serviço não existe mais. Faça login novamente." },
      { status: 404 }
    );
  }

  if (cadastroClienteCompleto(atual as OrdemDeServico)) {
    return NextResponse.json(
      { error: "Seu cadastro já está completo. Para corrigir algum dado, fale com a oficina." },
      { status: 409 }
    );
  }

  const { data: atualizadas, error } = await supabase
    .from(TABELA_OS)
    .update({
      cliente_nome,
      cliente_cpf,
      cliente_endereco,
      cliente_cep,
      cliente_numero,
      cliente_complemento: cliente_complemento || null,
      cliente_telefone,
    })
    .eq("id", osId)
    .select("id");

  if (error) return NextResponse.json({ error: "Erro ao salvar cadastro." }, { status: 500 });

  // mesma checagem de antes, agora para a exclusão que caia entre as duas idas
  if (!atualizadas || atualizadas.length === 0) {
    return NextResponse.json(
      { error: "Esta ordem de serviço não existe mais. Faça login novamente." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
