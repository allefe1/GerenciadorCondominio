# Gerenciador de Condomínio

Aplicação web para gestão de usuários, áreas comuns e reservas de condomínio. O projeto usa Next.js, Prisma e Supabase PostgreSQL.

## Funcionalidades

- Login único em /login, com identificação automática do perfil e redirecionamento para o painel correspondente.
- Perfis de MORADOR, ADMINISTRADOR e SINDICO.
- Bloqueio de conta após três tentativas de login inválidas, por quinze minutos.
- Primeiro acesso obrigatório com definição de senha forte.
- Recuperação e redefinição de senha por token.
- Gestão de usuários, áreas comuns e perfil do usuário.
- Solicitação, confirmação, cancelamento e histórico de reservas.
- Exportação de reservas em CSV para administradores e síndicos.
- Auditoria das principais operações no banco.

## Stack

- Next.js 15
- React 19 e TypeScript
- Tailwind CSS
- Prisma 6
- Supabase PostgreSQL

## Pré-requisitos

- Node.js 20 ou superior.
- npm.
- Projeto Supabase ativo, com acesso ao banco PostgreSQL.

## Instalação

~~~bash
git clone <URL_DO_REPOSITORIO>
cd GerenciadorCondominio
npm install
cp .env.example .env
~~~

No Windows PowerShell:

~~~powershell
Copy-Item .env.example .env
npm.cmd install
~~~

## Variáveis de ambiente

Edite o arquivo .env criado a partir de .env.example.

~~~env
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@<POOLER_HOST>:6543/postgres?sslmode=require&pgbouncer=true"
AUTH_SECRET="<CHAVE_ALEATORIA_FORTE>"
APP_URL="http://localhost:3000"
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="nao-responda@condoreserva.com"
~~~

### Supabase

Copie a URI em **Supabase > Connect > Transaction pooler**. A senha deve ser a senha do banco, não uma API key. A URL deve manter:

- porta 6543;
- sslmode=require;
- pgbouncer=true;
- usuário no formato postgres.<PROJECT_REF>.

Gere uma chave para AUTH_SECRET:

~~~bash
openssl rand -hex 32
~~~

Não versione .env, chaves, senhas ou a URI real do banco.

## Banco de dados

Gere o Prisma Client:

~~~bash
npm run db:generate
~~~

Para inicializar um banco vazio com schema, seeds e migrations:

~~~bash
npm run db:bootstrap
~~~

Para aplicar apenas a migration de reservas e notificações:

~~~bash
npm run db:migrate:003
~~~

> db:bootstrap é destinado a banco vazio ou reinicialização explícita. Não o execute em um banco com dados que precisam ser preservados.

## Execução

Ambiente de desenvolvimento:

~~~bash
npm run dev
~~~

Abra http://localhost:3000/login. Se a porta estiver ocupada, o Next.js usa a próxima porta disponível e informa o endereço no terminal.

Build de produção:

~~~bash
npm run runbuild
npm run start
~~~

O comando runbuild gera o Prisma Client antes de executar o build:

~~~text
npm run db:generate && next build
~~~

## Login e perfis

Use apenas a tela /login. Após validar e-mail e senha, o sistema identifica o tipo de usuário e redireciona automaticamente:

| Perfil | Painel |
| --- | --- |
| Morador | /morador |
| Administrador | /admin |
| Síndico | /sindico |

As rotas legadas /login/morador, /login/admin e /login/sindico redirecionam para /login.

Em instalações criadas pelas seeds originais, as credenciais de demonstração documentadas são:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Morador | morador@condo.com | Morador@123 |
| Administrador | admin@condo.com | Admin@123 |
| Síndico | sindico@condoreserva.com | Sindico@123 |

Troque essas senhas antes de qualquer publicação. Contas demo.reserva.*@condoreserva.local são geradas para dados de demonstração e não possuem senha compartilhada.

## Reservas de demonstração

Para gerar dados de teste:

~~~bash
npm run db:seed-reservas
~~~

O comando cria cinco reservas confirmadas por dia nos próximos quinze dias, totalizando 75 reservas. Ele evita conflito de horários, respeita o limite mensal configurado e cria moradores de demonstração somente quando necessário para manter a regra de negócio.

O script é idempotente para as reservas de demonstração: execuções seguintes não duplicam os mesmos horários.

Para criar cinco reservas de demonstração para o dia atual, das 14h às 19h:

~~~bash
npm run db:seed-reservas-hoje
~~~

## Exportação de reservas

Administradores e síndicos podem abrir /admin/reservas ou /sindico/reservas e usar **Exportar CSV**.

A exportação:

- exige sessão de administrador ou síndico;
- não permite conta em primeiro acesso;
- produz arquivo CSV sem cache;
- neutraliza valores que poderiam ser interpretados como fórmulas por planilhas;
- registra a operação em log_atividade.

## Rotas principais

| Área | Rotas |
| --- | --- |
| Autenticação | /login, /primeiro-acesso, /recuperar-senha |
| Morador | /morador, /morador/reservas, /perfil |
| Administrador | /admin, /admin/usuarios, /admin/areas, /admin/reservas |
| Síndico | /sindico, /sindico/usuarios, /sindico/areas, /sindico/reservas |
| API | /api/reservas/export |

## Comandos úteis

| Comando | Finalidade |
| --- | --- |
| npm run dev | Inicia o ambiente de desenvolvimento. |
| npm run runbuild | Gera o Prisma Client e compila o projeto. |
| npm run start | Inicia o build de produção. |
| npm run db:generate | Gera o Prisma Client. |
| npm run db:bootstrap | Inicializa schema, seeds e migrations em banco vazio. |
| npm run db:migrate:003 | Aplica a migration de reservas e notificações. |
| npm run db:seed-reservas | Gera 75 reservas de demonstração. |
| npm run db:seed-reservas-hoje | Gera cinco reservas de demonstração para o dia atual, a partir das 14h. |

## Segurança

- Sessão assinada com JWT e cookie httpOnly.
- AUTH_SECRET obrigatória e aleatória.
- Senhas armazenadas com bcrypt.
- Validação de formulários com Zod.
- Redirecionamentos internos validados.
- Cabeçalhos de segurança para MIME sniffing, framing, referrer e permissões do navegador.
- Dependências atualizadas e auditadas com npm audit.

## Verificação antes do push

~~~bash
npm install
npm run runbuild
npm audit --omit=dev
git status
~~~

Confirme que .env não aparece no git status antes de enviar alterações ao repositório.
