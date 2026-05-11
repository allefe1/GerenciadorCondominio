BEGIN;

INSERT INTO usuario (
    tipo_usuario,
    nome_completo,
    email,
    senha,
    telefone,
    status,
    apartamento,
    bloco,
    permissoes_acesso
)
SELECT
    'ADMINISTRADOR',
    'Administrador Principal',
    'admin@condo.com',
    '$2b$12$H1K8yQDX2wYGe9UP.ytaruzdogcH5yCs62w3cL6M7lecC1zD94cce',
    '(11) 99999-0002',
    'ATIVO',
    NULL,
    NULL,
    ARRAY['GERENCIAR_MORADORES', 'GERENCIAR_RESERVAS']
WHERE NOT EXISTS (
    SELECT 1 FROM usuario WHERE email = 'admin@condo.com'
);

INSERT INTO usuario (
    tipo_usuario,
    nome_completo,
    email,
    senha,
    telefone,
    status,
    apartamento,
    bloco,
    permissoes_acesso
)
SELECT
    'MORADOR',
    'Gabriel Morador',
    'morador@condo.com',
    '$2b$12$D6fZKLXHSAL6DqV3VVZOd.VfKrkPzG4bkCIYR4ZfUB49OE6ul3.5a',
    '(11) 99999-0003',
    'ATIVO',
    '402',
    'B',
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM usuario WHERE email = 'morador@condo.com'
);

UPDATE usuario
SET senha = '$2b$12$qFYYnveqUesrxo0ar53kQOXSi//Y.81r/wloU5n5FqJ9EPUEn4pAK'
WHERE email = 'sindico@condoreserva.com';

COMMIT;
