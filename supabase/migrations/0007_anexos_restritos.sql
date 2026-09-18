-- Rode no SQL Editor do Supabase depois das migrações anteriores.
--
-- Aperta o que pode entrar no bucket dos anexos.
--
-- O upload vai do navegador DIRETO para o Storage (não passa por rota nossa),
-- e a policy antiga aceitava qualquer arquivo, com qualquer nome e qualquer
-- tamanho, de qualquer usuário autenticado. A lista de extensões do
-- lib/anexos.ts só valia no navegador: dava para subir um .svg — que é página
-- executável servida pelo domínio do Storage — por fora do formulário.
--
-- Agora a regra mora no banco, que é onde ela não tem como ser pulada:
--   1. o arquivo precisa estar numa pasta com o número da O.S. (ex: "42/...")
--   2. a extensão precisa estar na lista
--   3. o bucket ganha teto de tamanho e lista de tipos MIME

update storage.buckets
set
  file_size_limit = 10485760, -- 10 MB, o mesmo MAX_ANEXO_MB do lib/anexos.ts
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
    'image/avif', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet'
  ]
where id = 'checklist-fotos';

drop policy if exists "checklist_fotos_insert_authenticated" on storage.objects;
create policy "checklist_fotos_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checklist-fotos'
    -- primeira pasta do caminho é o id da O.S.
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    -- e a extensão está na lista fechada
    and name ~* '\.(jpg|jpeg|png|webp|gif|bmp|avif|heic|heif|pdf|txt|csv|doc|docx|xls|xlsx|odt|ods)$'
  );
