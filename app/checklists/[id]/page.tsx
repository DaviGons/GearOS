import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Checklist } from "@/lib/types";
import PrintButton from "./print-button";
import DeleteButton from "./delete-button";
import ChecklistEditor from "./checklist-editor";

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

  let fotoUrls: string[] = [];
  if (checklist.fotos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("checklist-fotos")
      .createSignedUrls(checklist.fotos, 3600);
    fotoUrls = (signed ?? [])
      .map((s) => s.signedUrl)
      .filter((url): url is string => Boolean(url));
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 print:py-0 print:max-w-full">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3">
          <DeleteButton id={checklist.id} />
          <PrintButton />
        </div>
      </div>

      <ChecklistEditor checklist={checklist} fotoUrls={fotoUrls} />
    </main>
  );
}
