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

## Deploy

Projeto pronto para deploy na Vercel. Configure as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no painel do projeto na Vercel.
