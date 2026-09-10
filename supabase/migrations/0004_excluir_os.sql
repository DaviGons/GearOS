-- Rode no SQL Editor do Supabase depois das migrações anteriores.
-- Permite que usuários autenticados (equipe da oficina) excluam uma O.S.

drop policy if exists "checklists_delete_authenticated" on public.checklists;
create policy "checklists_delete_authenticated"
  on public.checklists for delete
  to authenticated
  using (true);
