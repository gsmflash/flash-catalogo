# Flash Cell — Catálogo de Celulares

Catálogo de celulares para a loja Flash Cell. Monorepo com frontend (Next.js), backend (Express) e um pacote de tipos/regras compartilhadas.

## Produção

- **Catálogo:** https://flash-catalogo-web.vercel.app
- **Painel admin:** https://flash-catalogo-web.vercel.app/admin/login
- **API:** https://flash-catalogo-production.up.railway.app/api
- Repositório: https://github.com/gsmflash/flash-catalogo

## Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion — deploy na Vercel
- **Backend:** Node.js, Express, TypeScript, Drizzle ORM — deploy no Railway
- **Banco de dados:** PostgreSQL (Neon)
- **Imagens:** Cloudflare R2
- **Autenticação:** JWT + bcrypt

## Estrutura

```
apps/
  api/      # Backend Express (porta 4000)
  web/      # Frontend Next.js (porta 3000)
packages/
  shared/   # Tipos, validação (zod), cálculo de parcelas, mensagem de WhatsApp
```

## Desenvolvimento local

Pré-requisitos: Node 20+, pnpm, uma connection string do Postgres (Neon/Railway/local).

```bash
pnpm install

# configure as variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# edite os dois arquivos com os valores reais

# schema do banco
pnpm --filter @flashcell/api db:migrate
pnpm --filter @flashcell/api db:seed   # cria categorias, taxas InfinitePay, config padrão e usuário admin

# rodar em desenvolvimento (dois terminais)
pnpm dev:api
pnpm dev:web
```

Acesse `http://localhost:3000` (catálogo) e `http://localhost:3000/admin/login` (painel administrativo).

O usuário admin inicial é criado com os dados de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` do `apps/api/.env`.

## Variáveis de ambiente

### `apps/api/.env`

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Postgres |
| `JWT_SECRET` | Segredo para assinar tokens (string aleatória longa) |
| `JWT_EXPIRES_IN` | Validade do token (ex: `7d`) |
| `PORT` | Porta do servidor (Railway define automaticamente em produção) |
| `CORS_ORIGIN` | URL(s) do frontend permitidas (separadas por vírgula) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Credenciais do Cloudflare R2 |
| `SEED_ADMIN_NAME/EMAIL/PASSWORD` | Usado apenas por `db:seed` para criar o primeiro admin |

### `apps/web/.env.local`

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública da API (ex: `https://api.flashcell.com.br/api`) |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | URL pública do bucket R2 (usada para liberar o domínio no `next/image`) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (usada em metadata, sitemap e Open Graph) |

## Deploy

### Backend (Railway)

1. Crie um novo serviço no Railway apontando para este repositório.
2. Root directory: **raiz do repositório** (o `railway.json` em `apps/api/` já define build/start commands via pnpm workspaces — cole o conteúdo de `apps/api/railway.json` nas configurações do serviço, ou aponte "Config as code path" para `apps/api/railway.json`).
3. Configure as variáveis de ambiente listadas acima (todas as de `apps/api/.env`, exceto `PORT`).
4. Antes do primeiro deploy, rode as migrations contra o banco de produção:
   ```bash
   DATABASE_URL="<url-de-produção>" pnpm --filter @flashcell/api db:migrate
   DATABASE_URL="<url-de-produção>" pnpm --filter @flashcell/api db:seed
   ```
5. Após o deploy, anote a URL pública gerada pelo Railway (ex: `https://flashcell-api.up.railway.app`).

### Frontend (Vercel)

1. Importe o repositório na Vercel.
2. Root Directory: `apps/web`.
3. Framework preset: Next.js (detectado automaticamente).
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL` = `https://<sua-api-no-railway>/api`
   - `NEXT_PUBLIC_R2_PUBLIC_URL` = URL pública do bucket R2
   - `NEXT_PUBLIC_SITE_URL` = domínio final do site (ex: `https://flashcell.com.br`)
5. Deploy. A Vercel cuida de build/CDN/HTTPS automaticamente.

Depois do primeiro deploy, atualize `CORS_ORIGIN` na API do Railway para incluir o domínio final da Vercel (pode listar vários, separados por vírgula — inclua o domínio de produção e o domínio `-git-main-` do branch).

> Nota: o build do Railway usa o pnpm já provisionado pelo Railpack (via `mise`, versão fixada em `pnpm-lock.yaml`). Não use `corepack enable` no build command — isso baixa a versão mais recente do pnpm, que aplica uma política de "minimum release age" e pode rejeitar dependências publicadas recentemente.
>
> No Vercel, como `apps/web` depende do workspace `@flashcell/shared`, é necessário sobrescrever o Build Command do projeto para compilar o pacote compartilhado antes do `next build`:
> ```
> pnpm --filter @flashcell/shared build && pnpm run build
> ```

### Cloudflare R2

1. Crie um bucket (Cloudflare Dashboard → R2).
2. Habilite "Public access" (R2.dev subdomain) ou configure um domínio customizado.
3. Crie um API Token com permissão de leitura/escrita no bucket (Object Read & Write) e use o Access Key ID/Secret Access Key gerados.
4. Preencha `R2_ACCOUNT_ID` (aparece na URL do endpoint S3), `R2_BUCKET_NAME` e `R2_PUBLIC_URL`.

## Regras de negócio importantes

- **Cálculo de parcelas:** o admin cadastra apenas um "preço" por produto. O valor cobrado em cada modalidade (débito, crédito à vista, 2x–12x) é `preço ÷ (1 − taxa da modalidade)`, garantindo que a loja sempre receba o valor líquido cadastrado. Editar uma taxa em Financeiro recalcula automaticamente todos os produtos que usam aquela máquina (o valor não é armazenado, é calculado na hora da consulta).
- **Status "Vendido":** produtos com esse status somem do catálogo público automaticamente, mas continuam salvos e visíveis no painel admin.
- **Duplicar produto:** copia todos os campos e imagens para um novo produto com status "Em breve", para agilizar cadastros de aparelhos parecidos.
