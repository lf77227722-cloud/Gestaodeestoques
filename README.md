# Gestão para batatarias

Aplicação móvel de vendas, finanças, estoque e ficha técnica. Cada conta Supabase Auth possui registros isolados por RLS.

## Configuração

1. Crie um projeto Supabase e execute `supabase/migrations/20261027180000_initial.sql` no banco.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na Vercel.
3. Em Supabase Authentication, configure `https://gestaodeestoques.vercel.app` como Site URL. Para permitir acesso imediato após o cadastro, desligue `Confirm email` em Authentication → Providers → Email.
4. Configure SMTP próprio em Authentication → SMTP Settings para que a recuperação de senha chegue aos emails dos clientes. O servidor de email padrão do Supabase restringe destinatários e não serve para produção.
5. Instale dependências com `npm ci` e execute `npm run build`.

A ficha técnica armazena o consumo por produto; a venda preserva uma cópia da receita usada e o estoque é calculado a partir dos movimentos e das vendas.
