import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPortalToken, PORTAL_COOKIE_NAME, PORTAL_COOKIE_MAX_AGE } from "@/lib/portal-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const placa = String(body.placa || "").trim().toUpperCase();
  const telefoneFinal = String(body.telefone || "").replace(/\D/g, "");

  if (!placa || telefoneFinal.length !== 4) {
    return NextResponse.json(
      { error: "Informe a placa e os 4 últimos dígitos do telefone." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("checklists")
    .select("id, cliente_telefone")
    .eq("veiculo_placa", placa)
    .order("id", { ascending: false });

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
