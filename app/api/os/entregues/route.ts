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
    console.error("DELETE /api/checklists/entregues (busca)", erroBusca);
    return NextResponse.json({ error: "Não consegui ler as O.S. entregues." }, { status: 500 });
  }

  if (!alvos || alvos.length === 0) {
    return NextResponse.json({ excluidas: 0 });
  }

  // As linhas saem primeiro. Antes os anexos eram removidos antes do DELETE:
  // se o DELETE falhasse no meio, as O.S. continuavam no quadro com todas as
  // fotos já apagadas do bucket — e não há como trazer de volta.
  const { data: apagadas, error } = await supabase
    .from("checklists")
    .delete()
    .eq("status", "entregue")
    .select("id, fotos");

  if (error) {
    console.error("DELETE /api/checklists/entregues", error);
    return NextResponse.json({ error: "Não consegui excluir as O.S. entregues." }, { status: 500 });
  }

  // só os anexos das O.S. que realmente saíram, senão ficariam ocupando
  // espaço sem dono
  const anexos = (apagadas ?? []).flatMap((linha) => (linha.fotos as string[] | null) ?? []);
  if (anexos.length > 0) {
    await supabase.storage.from(BUCKET_ANEXOS).remove(anexos);
  }

  return NextResponse.json({ excluidas: apagadas?.length ?? 0 });
}
