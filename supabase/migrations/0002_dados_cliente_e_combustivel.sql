-- Rode este script se você já tinha executado o supabase/schema.sql anterior
-- (tabela public.checklists já existe). Ajusta os campos do cliente,
-- adiciona o tipo de combustível e remove a seção de itens presentes.

alter table public.checklists
  rename column cliente_documento to cliente_cpf;

alter table public.checklists
  add column if not exists cliente_cep text,
  add column if not exists cliente_numero text,
  add column if not exists cliente_complemento text,
  add column if not exists veiculo_tipo_combustivel text
    check (veiculo_tipo_combustivel in ('diesel', 'alcool', 'gasolina'));

alter table public.checklists
  drop column if exists itens;
