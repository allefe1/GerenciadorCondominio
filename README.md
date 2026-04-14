# Gerenciador de Condomínio

Aplicação web para autenticação, gestão de usuários e reservas de áreas comuns, construída a partir da modelagem PostgreSQL, dos protótipos HTML e do design system do projeto original.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma
- Supabase (PostgreSQL gerenciado)

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
- Projeto Supabase com banco ativo

## Setup recomendado (Supabase + PowerShell)

### 1. Entrar no projeto

```powershell
cd "C:\Users\filipez\Documents\GerenciadorCondominio"
```

### 2. Criar `.env`

```powershell
Copy-Item .env.example .env -Force
notepad .env
```

Use pelo menos estes valores:

```env
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
AUTH_SECRET="123456"
APP_URL="http://localhost:3000"
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="nao-responda@condoreserva.com"
```

### 3. Instalar dependências

Se o PowerShell bloquear `npm`, use `npm.cmd`:

```powershell
npm.cmd install
```

### 4. Regenerar Prisma Client

```powershell
npm.cmd run db:generate
```

### 5. Rodar a aplicação

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
npm.cmd run db:migrate:003
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

### 3. Erro de conexão SSL/host no Supabase

Confira se sua `DATABASE_URL`:

- usa host do projeto Supabase
- inclui `?sslmode=require`
- usa senha correta do banco

### 4. `The table public.notificacao does not exist`

Seu banco não recebeu a migration `003`. Rode:

```powershell
npm.cmd run db:migrate:003
npm.cmd run db:generate
```

### 5. `The table public.usuario does not exist`

Seu banco Supabase não está com o schema esperado deste projeto. Reaplique o setup de banco (schema + seeds) antes de subir a aplicação.

### 6. Erro com enum `PENDENTE` ou `REPROVADA`

Também indica banco parcialmente migrado. Rode:

```powershell
npm.cmd run db:migrate:003
```

## Observações

- O SQL original continua sendo a fonte principal de verdade do projeto.
- As migrations incrementais preservam o arquivo base e registram as evoluções necessárias para autenticação, notificações e fluxo de reservas.
- O ambiente padrão agora é Supabase para facilitar colaboração entre múltiplos devs.
