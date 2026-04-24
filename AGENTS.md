<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras para agentes — Trixer

## Antes de qualquer alteração

1. Leia `CLAUDE.md` completo
2. Supabase pode estar **pausado** — verifique antes de debugar código
3. Nunca rode `next build` ou `tsc` localmente — Node v25 é incompatível
4. Use `PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod` para deploy

## Clientes Supabase

- Páginas públicas → `createPublicClient()`
- Server actions admin → `createAdminClient()` + `await requireAdmin()` obrigatório
- Auth/layout → `createClient()`

## Padrões do projeto

- Sem `force-dynamic` em páginas — usar `export const revalidate = 3600`
- Mutações sempre via Server Actions (`'use server'`), nunca route handlers no admin
- Tailwind v4: sem `tailwind.config.js`, tudo em `globals.css` com `@theme inline`
- Alias `~/` para imports absolutos a partir de `/`
- Banco: unique constraint em athletes é `(name, gender, type)`

## Fluxo admin pós-prova

1. Importar resultados em `/admin/resultados` (JSON com bib ou athlete_name)
2. Calcular pontos em `/admin/pontuacao` → prova vira `finished` automaticamente
3. Rankings ficam disponíveis nas ligas
