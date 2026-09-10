import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key — ignora RLS. Uso restrito a rotas
 * server-side que precisam ler/gravar fora do contexto de um usuário
 * autenticado da equipe (ex: portal do cliente).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
