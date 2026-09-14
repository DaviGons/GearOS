import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { PORTAL_COOKIE_NAME, verifyPortalToken } from "@/lib/portal-session";
import { isValidCPF } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  if (!checkRateLimit(request, "portal-cadastro", { limit: 20, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  const cookieStore = await cookies();
  const checklistId = verifyPortalToken(cookieStore.get(PORTAL_COOKIE_NAME)?.value);

  if (!checklistId) {
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

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("checklists")
    .update({
      cliente_nome,
      cliente_cpf,
      cliente_endereco,
      cliente_cep,
      cliente_numero,
      cliente_complemento: cliente_complemento || null,
      cliente_telefone,
    })
    .eq("id", checklistId);

  if (error) return NextResponse.json({ error: "Erro ao salvar cadastro." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
