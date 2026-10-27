# Gestão para batatarias

Aplicação móvel de vendas, finanças, estoque e ficha técnica. Cada conta Supabase Auth possui registros isolados por RLS.

## Configuração

1. Crie um projeto Supabase e execute `supabase/migrations/20261027180000_initial.sql` no banco.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na Vercel.
3. Em Supabase Authentication, configure o URL do aplicativo como Site URL. O cadastro por email e senha usa confirmação por email conforme configuração do projeto.
4. Instale dependências com `npm ci` e execute `npm run build`.

A ficha técnica armazena o consumo por produto; a venda preserva uma cópia da receita usada e o estoque é calculado a partir dos movimentos e das vendas.
