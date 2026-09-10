-- Rode no SQL Editor do Supabase depois das migrações anteriores.
-- Campo de endereço (rua/logradouro) preenchido pelo cliente no
-- cadastro completo, exibido no primeiro acesso ao portal.

alter table public.checklists
  add column if not exists cliente_endereco text;
