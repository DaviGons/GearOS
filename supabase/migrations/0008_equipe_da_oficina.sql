-- Rode no SQL Editor do Supabase depois das migrações anteriores.
--
-- POR QUE: as policies diziam `to authenticated using (true)` — isto é,
-- "qualquer usuário logado vê e apaga tudo". Isso só seria seguro se logar
-- fosse privilégio da equipe, mas o cadastro público do projeto está ABERTO
-- (disable_signup = false) e a anon key fica no bundle do navegador. Na
-- prática, qualquer pessoa da internet podia criar conta com um e-mail
-- próprio, confirmar, e entrar como `authenticated` — ganhando leitura,
-- edição e exclusão de TODAS as O.S. e de todos os anexos.
--
-- A correção principal é no painel: Authentication -> Sign In / Providers ->
-- desligar "Allow new users to sign up". Esta migração é a segunda tranca:
-- mesmo que o cadastro seja reaberto um dia por engano, uma conta nova não
-- enxerga nada, porque agora não basta estar logado — é preciso estar na
-- lista da equipe.
--
-- NÃO TRAVA NINGUÉM DE FORA: a lista já nasce semeada com todos os usuários
-- que existem hoje no projeto.

create table if not exists public.oficina_equipe (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  criado_em timestamptz not null default now()
);

-- semeia com quem já tem conta hoje (você), antes de trocar as policies
insert into public.oficina_equipe (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

alter table public.oficina_equipe enable row level security;

-- a própria lista não é editável pelo app: entra e sai gente pelo painel
-- (service role). Cada um só consegue verificar a si mesmo.
drop policy if exists "equipe_ve_a_si_mesma" on public.oficina_equipe;
create policy "equipe_ve_a_si_mesma"
  on public.oficina_equipe for select
  to authenticated
  using (user_id = (select auth.uid()));

-- security definer: a função precisa ler a tabela sem depender da policy
-- acima, senão vira recursão de RLS.
create or replace function public.eh_da_equipe()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.oficina_equipe e where e.user_id = (select auth.uid())
  );
$$;

revoke all on function public.eh_da_equipe() from public;
grant execute on function public.eh_da_equipe() to authenticated;

-- ---------------------------------------------------------------------------
-- checklists: trocar `using (true)` por "está na equipe?"
-- ---------------------------------------------------------------------------

drop policy if exists "checklists_select_authenticated" on public.checklists;
create policy "checklists_select_authenticated"
  on public.checklists for select
  to authenticated
  using (public.eh_da_equipe());

drop policy if exists "checklists_insert_authenticated" on public.checklists;
create policy "checklists_insert_authenticated"
  on public.checklists for insert
  to authenticated
  with check (public.eh_da_equipe());

drop policy if exists "checklists_update_authenticated" on public.checklists;
create policy "checklists_update_authenticated"
  on public.checklists for update
  to authenticated
  using (public.eh_da_equipe())
  with check (public.eh_da_equipe());

drop policy if exists "checklists_delete_authenticated" on public.checklists;
create policy "checklists_delete_authenticated"
  on public.checklists for delete
  to authenticated
  using (public.eh_da_equipe());

-- ---------------------------------------------------------------------------
-- anexos no Storage: mesma regra, mantendo as restrições da migração 0007
-- ---------------------------------------------------------------------------

drop policy if exists "checklist_fotos_select_authenticated" on storage.objects;
create policy "checklist_fotos_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'checklist-fotos' and public.eh_da_equipe());

drop policy if exists "checklist_fotos_insert_authenticated" on storage.objects;
create policy "checklist_fotos_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checklist-fotos'
    and public.eh_da_equipe()
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and name ~* '\.(jpg|jpeg|png|webp|gif|bmp|avif|heic|heif|pdf|txt|csv|doc|docx|xls|xlsx|odt|ods)$'
  );

drop policy if exists "checklist_fotos_delete_authenticated" on storage.objects;
create policy "checklist_fotos_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'checklist-fotos' and public.eh_da_equipe());

-- Para adicionar alguém da oficina depois:
--   insert into public.oficina_equipe (user_id, email)
--   select id, email from auth.users where email = 'fulano@exemplo.com';
