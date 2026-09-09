-- Rode no SQL Editor do Supabase depois das migrações anteriores.
-- Muda o status de 3 para 4 categorias (quadro kanban) e adiciona
-- suporte a fotos do veículo no cadastro.

-- 1) Atualiza os dados existentes para os novos nomes de status
alter table public.checklists
  drop constraint if exists checklists_status_check;

update public.checklists set status = 'recebido' where status = 'aberta';
update public.checklists set status = 'finalizado' where status = 'concluida';

alter table public.checklists
  add constraint checklists_status_check
  check (status in ('recebido', 'em_andamento', 'finalizado', 'entregue'));

alter table public.checklists
  alter column status set default 'recebido';

-- 2) Coluna de fotos (caminhos no Storage, não URLs completas)
alter table public.checklists
  add column if not exists fotos text[] not null default '{}';

-- 3) Bucket privado no Storage para as fotos do checklist
insert into storage.buckets (id, name, public)
values ('checklist-fotos', 'checklist-fotos', false)
on conflict (id) do nothing;

drop policy if exists "checklist_fotos_select_authenticated" on storage.objects;
create policy "checklist_fotos_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'checklist-fotos');

drop policy if exists "checklist_fotos_insert_authenticated" on storage.objects;
create policy "checklist_fotos_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'checklist-fotos');

drop policy if exists "checklist_fotos_delete_authenticated" on storage.objects;
create policy "checklist_fotos_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'checklist-fotos');
