BEGIN;

CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id              SERIAL PRIMARY KEY,
    id_usuario      INTEGER NOT NULL,
    token           VARCHAR(255) NOT NULL,
    expira_em       TIMESTAMP NOT NULL,
    usado_em        TIMESTAMP,
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_recuperacao_senha_token UNIQUE (token),
    CONSTRAINT fk_recuperacao_senha_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recuperacao_senha_usuario
    ON recuperacao_senha (id_usuario);

CREATE INDEX IF NOT EXISTS idx_recuperacao_senha_token
    ON recuperacao_senha (token);

COMMENT ON TABLE recuperacao_senha IS 'Tokens de recuperação de senha com expiração e uso único.';
COMMENT ON COLUMN recuperacao_senha.token IS 'Token aleatório enviado por e-mail ao usuário.';

COMMIT;
