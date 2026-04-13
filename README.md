# Gerenciador de Condomínio

Aplicação web para autenticação, gestão de usuários e reservas de áreas comuns, construída a partir da modelagem PostgreSQL, dos protótipos HTML e do design system do projeto original.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Docker Compose para banco local recomendado

## Status funcional

O projeto já entrega:

- login por portal:
  - `/login/morador`
  - `/login/admin`
  - `/login/sindico`
- logout
- bloqueio após 3 tentativas falhas por 15 minutos
- recuperação de senha por token
- perfis `MORADOR`, `ADMINISTRADOR` e `SINDICO`
- gestão de usuários
- meu perfil e troca de senha
- solicitação, cancelamento, aprovação e reprovação de reservas
- notificações para decisões de reserva

## Pré-requisitos

Para rodar no Windows com PowerShell:

- Node.js 20+ com `npm`
- Docker Desktop com Docker Compose habilitado

Opcional para modo manual sem Docker:

- PostgreSQL 16+ instalado localmente
- `psql` disponível no PATH ou em `C:\Program Files\PostgreSQL\<versao>\bin\psql.exe`

## Modo recomendado: Docker + PowerShell

### 1. Entrar no projeto

```powershell
cd "C:\Users\Matheus\Documents\GitHub\GerenciadorCondominio"
```

### 2. Criar `.env`

```powershell
Copy-Item .env.example .env -Force
notepad .env
```

Use pelo menos estes valores:

```env
POSTGRES_DB="condoreserva"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_PORT="5432"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/condoreserva?schema=public"
AUTH_SECRET="123456"
APP_URL="http://localhost:3000"
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="nao-responda@condoreserva.com"
DOCKER_DB_SERVICE="postgres"
```

### 3. Instalar dependências

Se o PowerShell bloquear `npm`, use `npm.cmd`:

```powershell
npm.cmd install
```

### 4. Subir o PostgreSQL em Docker

```powershell
npm.cmd run db:docker:up
```

Se quiser acompanhar o banco:

```powershell
npm.cmd run db:docker:logs
```

### 5. Aplicar schema e migrations

```powershell
npm.cmd run db:bootstrap
npm.cmd run db:generate
```

O bootstrap aplica, nesta ordem:

- `ModelagemBanco/condoreserva_database.sql`
- `db/migrations/001_seed_usuarios_iniciais.sql`
- `db/migrations/002_auth_recuperacao_senha.sql`
- `db/migrations/003_reservas_aprovacao_notificacoes.sql`

### 6. Rodar a aplicação

```powershell
npm.cmd run dev
```

Abra:

- `http://localhost:3000/login`
- `http://localhost:3000/login/morador`
- `http://localhost:3000/login/admin`
- `http://localhost:3000/login/sindico`

## Credenciais iniciais

- Morador
  - `morador@condo.com`
  - `Morador@123`
- Administrador
  - `admin@condo.com`
  - `Admin@123`
- Síndico
  - `sindico@condoreserva.com`
  - `Sindico@123`

## Fluxo de teste recomendado

### Autenticação

1. Acesse `/login/morador` e entre com o morador.
2. Acesse `/login/admin` e entre com o administrador.
3. Acesse `/login/sindico` e entre com o síndico.
4. Tente usar um perfil no portal errado para validar o bloqueio de acesso.
5. Tente errar a senha 3 vezes para validar o bloqueio temporário.

### Usuários

1. Entre como admin ou síndico.
2. Acesse `/admin/usuarios` ou `/sindico/usuarios`.
3. Cadastre um novo morador.
4. Edite o usuário criado.
5. Ative ou inative um usuário.
6. Acesse `/perfil` e altere seus próprios dados.

### Reservas

1. Entre como morador.
2. Acesse `/morador/reservas`.
3. Solicite uma reserva futura.
4. Entre como admin ou síndico.
5. Acesse `/admin/reservas` ou `/sindico/reservas`.
6. Aprove ou reprove a solicitação.
7. Volte ao morador e confira notificações e histórico.

## Rotas principais

### Autenticação

- `/login`
- `/login/morador`
- `/login/admin`
- `/login/sindico`
- `/recuperar-senha`
- `/recuperar-senha/[token]`

### Morador

- `/morador`
- `/morador/reservas`
- `/perfil`

### Administrador

- `/admin`
- `/admin/usuarios`
- `/admin/reservas`

### Síndico

- `/sindico`
- `/sindico/usuarios`
- `/sindico/reservas`

## Comandos úteis

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:bootstrap
npm.cmd run db:migrate:003
npm.cmd run db:docker:up
npm.cmd run db:docker:down
npm.cmd run db:docker:logs
```

## Modo alternativo: PostgreSQL local sem Docker

Se preferir usar PostgreSQL já instalado no Windows:

1. Garanta que o serviço esteja rodando.
2. Crie o banco `condoreserva`.
3. Ajuste o `.env` com a `DATABASE_URL` correta.
4. Rode:

```powershell
npm.cmd run db:bootstrap
npm.cmd run db:generate
npm.cmd run dev
```

Se o `psql` não estiver no PATH, o bootstrap tenta localizar automaticamente em:

- `C:\Program Files\PostgreSQL\18\bin\psql.exe`
- `C:\Program Files\PostgreSQL\17\bin\psql.exe`
- versões anteriores até 12

Se necessário, force manualmente:

```powershell
$env:PSQL_PATH="C:\Program Files\PostgreSQL\18\bin\psql.exe"
npm.cmd run db:bootstrap
```

## Troubleshooting

### 1. `npm : ... execução de scripts foi desabilitada`

Use:

```powershell
npm.cmd install
npm.cmd run dev
```

### 2. `DATABASE_URL não definida`

Crie o `.env` corretamente:

```powershell
Copy-Item .env.example .env -Force
notepad .env
```

### 3. Erro de encoding ao importar SQL no Windows

O bootstrap já força:

- `PGCLIENTENCODING=UTF8`

Se for importar manualmente, rode antes:

```powershell
$env:PGCLIENTENCODING="UTF8"
```

### 4. `The table public.notificacao does not exist`

Seu banco não recebeu a migration `003`. Rode:

```powershell
npm.cmd run db:migrate:003
npm.cmd run db:generate
```

### 5. Erro com enum `PENDENTE` ou `REPROVADA`

Também indica banco parcialmente migrado. Rode:

```powershell
npm.cmd run db:migrate:003
```

### 6. `docker compose` não encontrado

Instale ou abra o Docker Desktop e confirme:

```powershell
docker compose version
```

### 7. Porta 5432 ocupada

Altere no `.env`:

```env
POSTGRES_PORT="5433"
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/condoreserva?schema=public"
```

Depois rode:

```powershell
npm.cmd run db:docker:down
npm.cmd run db:docker:up
```

## Observações

- O SQL original continua sendo a fonte principal de verdade do projeto.
- As migrations incrementais preservam o arquivo base e registram as evoluções necessárias para autenticação, notificações e fluxo de reservas.
- O ambiente via Docker é o caminho mais estável para evitar diferenças de configuração entre máquinas.
