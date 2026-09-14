-- Rode no SQL Editor do Supabase depois das migrações anteriores.
-- Índice na placa: é o campo usado no login do portal do cliente
-- (rota pública, sem autenticação), então é a consulta mais exposta
-- do sistema e a que mais compensa ter índice.

create index if not exists checklists_veiculo_placa_idx on public.checklists (veiculo_placa);
