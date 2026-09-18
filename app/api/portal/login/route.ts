import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPortalToken, PORTAL_COOKIE_NAME, PORTAL_COOKIE_MAX_AGE } from "@/lib/portal-session";
import { checkRateLimit, checkRateLimitChave } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request, "portal-login", { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const placa = String(body.placa || "").trim().toUpperCase();
  const telefoneFinal = String(body.telefone || "").replace(/\D/g, "");

  if (!placa || placa.length > 12 || telefoneFinal.length !== 4) {
    return NextResponse.json(
      { error: "Informe a placa e os 4 últimos dígitos do telefone." },
      { status: 400 }
    );
  }

  // Segundo freio, agora por placa em vez de por IP.
  //
  // O fator de autenticação aqui é fraco por natureza — a placa está escrita
  // no carro e o resto são 4 dígitos, ou seja, 10 mil combinações. O limite
  // por IP sozinho não segura quem troca de IP: sem isto, cada IP novo
  // ganhava 10 tentativas limpas contra a MESMA placa. Agora todas as
  // tentativas contra uma placa dividem o mesmo balde.
  //
  // Continua sendo um contador em memória, por instância — quem quiser
  // fechar isso de verdade precisa de um limitador distribuído (Upstash e
  // afins), que depende de infraestrutura que este projeto ainda não tem.
  if (!checkRateLimitChave(`portal-login-placa:${placa}`, { limit: 8, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "Muitas tentativas para esta placa. Tente de novo mais tarde." },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("checklists")
    .select("id, cliente_telefone")
    .eq("veiculo_placa", placa)
    .order("id", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar a O.S." }, { status: 500 });
  }

  const match = (data ?? []).find((row) =>
    (row.cliente_telefone ?? "").replace(/\D/g, "").endsWith(telefoneFinal)
  );

  if (!match) {
    return NextResponse.json({ error: "Placa ou telefone não conferem." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE_NAME, createPortalToken(match.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PORTAL_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
