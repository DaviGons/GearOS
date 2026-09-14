import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// O Next 16 renomeou a convenção `middleware` para `proxy`; o comportamento é
// o mesmo, só o nome do arquivo e da função mudaram.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Portal do cliente tem autenticação própria (cookie assinado), não usa
  // login da equipe — não passa pelo gate de sessão do Supabase Auth.
  if (pathname.startsWith("/portal") || pathname.startsWith("/api/portal")) {
    return NextResponse.next();
  }

  // Rotas de API (/api/checklists/*) já são protegidas pelas policies de
  // RLS no Postgres — o cliente Supabase de cada rota envia o token da
  // sessão junto com o pedido, e o banco recusa se não houver um usuário
  // autenticado válido. Não precisam do redirect de página (que devolve
  // HTML e quebra o `res.json()` do lado do cliente) nem da checagem de
  // sessão daqui, que é uma segunda ida à rede ao Supabase Auth
  // em cima da própria chamada — evitar isso corta pela metade a latência
  // de cada ação (mover card, salvar, excluir).
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
