# GearOS

Sistema de checklist de entrada / ordem de serviço para oficinas mecânicas. Next.js + Supabase (Postgres + Auth).

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.local.example` para `.env.local` e preencha com as chaves do seu projeto Supabase (Project Settings → API).

3. Rode o schema no Supabase (SQL Editor) usando `supabase/schema.sql` — se o banco já existir, aplique as migrações em `supabase/migrations/` na ordem.

4. Crie um usuário em Authentication → Users no painel do Supabase para fazer login.

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

## Portal do cliente

Cada O.S. gera um acesso somente-leitura para o cliente acompanhar o veículo em `/login` (aba "Sou cliente"): usuário é a placa, senha os 4 últimos dígitos do telefone informado na entrada. O acesso é derivado desses dados — não precisa cadastro separado e some automaticamente quando a O.S. é excluída.

## Deploy

Projeto pronto para deploy na Vercel. Configure as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` e `PORTAL_SESSION_SECRET` no painel do projeto na Vercel.
