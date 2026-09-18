import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Checklist } from "@/lib/types";
import { BUCKET_ANEXOS } from "@/lib/anexos";
import DeleteButton from "./delete-button";
import ChecklistEditor from "./checklist-editor";
import type { Anexo } from "./anexos";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("checklists")
    .select("*")
    .eq("id", id)
    .single();

  if (!row) notFound();

  const checklist = row as Checklist;

  // O bucket é privado: cada anexo vira uma URL assinada de 1h. O caminho vai
  // junto porque é ele, e não a URL, que identifica o arquivo na hora de
  // remover.
  let anexos: Anexo[] = [];
  if (checklist.fotos.length > 0) {
    const { data: assinadas } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrls(checklist.fotos, 3600);

    anexos = (assinadas ?? [])
      .map((item, i) => ({ caminho: checklist.fotos[i], url: item.signedUrl }))
      .filter((a): a is Anexo => Boolean(a.caminho && a.url));
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 print:py-0 print:max-w-full">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3">
          <DeleteButton id={checklist.id} />
        </div>
      </div>

      <ChecklistEditor checklist={checklist} anexos={anexos} />
    </main>
  );
}
