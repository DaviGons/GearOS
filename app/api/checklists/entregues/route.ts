import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_ANEXOS } from "@/lib/anexos";

/**
 * Limpa o quadro: apaga de uma vez todas as O.S. com status "entregue".
 *
 * Esta rota fica em /api/checklists/entregues, antes de /api/checklists/[id]
 * na ordem de resolução do Next — segmento fixo ganha do dinâmico, então não
 * há risco de "entregues" ser lido como um id.
 */
export async function DELETE() {
  const supabase = await createClient();

  const { data: alvos, error: erroBusca } = await supabase
    .from("checklists")
    .select("id, fotos")
    .eq("status", "entregue");

  if (erroBusca) {
    return NextResponse.json({ error: erroBusca.message }, { status: 500 });
  }

  if (!alvos || alvos.length === 0) {
    return NextResponse.json({ excluidas: 0 });
  }

  // os anexos saem junto, senão ficariam ocupando espaço sem dono
  const anexos = alvos.flatMap((linha) => (linha.fotos as string[] | null) ?? []);
  if (anexos.length > 0) {
    await supabase.storage.from(BUCKET_ANEXOS).remove(anexos);
  }

  const { data: apagadas, error } = await supabase
    .from("checklists")
    .delete()
    .eq("status", "entregue")
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ excluidas: apagadas?.length ?? 0 });
}
