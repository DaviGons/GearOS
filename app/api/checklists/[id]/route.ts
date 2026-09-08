import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Status } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Checklist não encontrado." }, { status: 404 });
  }

  return NextResponse.json(data);
}

type PatchBody = {
  status?: Status;
  observacoes?: string;
  avarias?: string | null;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = (await request.json()) as PatchBody;

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.observacoes !== undefined) update.observacoes = body.observacoes.trim();
  if (body.avarias !== undefined) update.avarias = body.avarias;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("checklists")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
