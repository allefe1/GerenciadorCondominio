ALTER TYPE status_reserva_enum ADD VALUE IF NOT EXISTS 'PENDENTE' BEFORE 'CONFIRMADA';
ALTER TYPE status_reserva_enum ADD VALUE IF NOT EXISTS 'REPROVADA' BEFORE 'CANCELADA';

ALTER TABLE reserva
    ADD COLUMN IF NOT EXISTS observacao_solicitacao TEXT,
    ADD COLUMN IF NOT EXISTS data_decisao TIMESTAMP,
    ADD COLUMN IF NOT EXISTS motivo_decisao TEXT,
    ADD COLUMN IF NOT EXISTS id_decidido_por INTEGER;

ALTER TABLE reserva
    ALTER COLUMN status_reserva SET DEFAULT 'PENDENTE';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_reserva_decidido_por'
    ) THEN
        ALTER TABLE reserva
            ADD CONSTRAINT fk_reserva_decidido_por
            FOREIGN KEY (id_decidido_por)
            REFERENCES usuario (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reserva_decidido_por
    ON reserva (id_decidido_por);

ALTER TABLE reserva
    DROP CONSTRAINT IF EXISTS chk_cancelamento_consistente;

ALTER TABLE reserva
    ADD CONSTRAINT chk_cancelamento_consistente CHECK (
        (status_reserva = 'CANCELADA' AND data_cancelamento IS NOT NULL)
        OR (status_reserva IN ('PENDENTE', 'CONFIRMADA', 'REPROVADA') AND data_cancelamento IS NULL)
    );

ALTER TABLE reserva
    DROP CONSTRAINT IF EXISTS chk_reserva_decisao_consistente;

ALTER TABLE reserva
    ADD CONSTRAINT chk_reserva_decisao_consistente CHECK (
        (
            status_reserva IN ('CONFIRMADA', 'REPROVADA')
            AND data_decisao IS NOT NULL
            AND id_decidido_por IS NOT NULL
        )
        OR (
            status_reserva IN ('PENDENTE', 'CANCELADA')
            AND data_decisao IS NULL
            AND id_decidido_por IS NULL
            AND motivo_decisao IS NULL
        )
    );

ALTER TABLE reserva
    DROP CONSTRAINT IF EXISTS chk_reserva_motivo_reprovacao;

ALTER TABLE reserva
    ADD CONSTRAINT chk_reserva_motivo_reprovacao CHECK (
        (status_reserva = 'REPROVADA' AND motivo_decisao IS NOT NULL)
        OR (status_reserva <> 'REPROVADA')
    );

COMMENT ON COLUMN reserva.observacao_solicitacao IS 'Observação opcional enviada pelo morador ao solicitar a reserva.';
COMMENT ON COLUMN reserva.data_decisao IS 'Data e hora da aprovação ou reprovação da solicitação.';
COMMENT ON COLUMN reserva.motivo_decisao IS 'Motivo informado na aprovação/reprovação, obrigatório para reprovação.';
COMMENT ON COLUMN reserva.id_decidido_por IS 'Administrador ou síndico responsável pela decisão da solicitação.';

CREATE OR REPLACE FUNCTION fn_validar_sobreposicao_reserva()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status_reserva = 'CONFIRMADA' THEN
        IF EXISTS (
            SELECT 1
            FROM reserva r
            WHERE r.id_area_comum = NEW.id_area_comum
              AND r.data_reserva = NEW.data_reserva
              AND r.status_reserva = 'CONFIRMADA'
              AND r.id <> COALESCE(NEW.id, 0)
              AND r.hora_inicio < NEW.hora_fim
              AND r.hora_fim > NEW.hora_inicio
        ) THEN
            RAISE EXCEPTION 'RESERVA_CONFLITO: Já existe uma reserva confirmada para esta área no horário solicitado (% de % a %).',
                NEW.data_reserva, NEW.hora_inicio, NEW.hora_fim;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validar_limite_mensal_reservas()
RETURNS TRIGGER AS $$
DECLARE
    v_limite INTEGER;
    v_total_mes INTEGER;
BEGIN
    IF NEW.status_reserva IN ('PENDENTE', 'CONFIRMADA') THEN
        SELECT COALESCE(valor::INTEGER, 5)
        INTO v_limite
        FROM configuracao
        WHERE chave = 'LIMITE_RESERVAS_MENSAL';

        SELECT COUNT(*)
        INTO v_total_mes
        FROM reserva
        WHERE id_morador = NEW.id_morador
          AND status_reserva IN ('PENDENTE', 'CONFIRMADA')
          AND id <> COALESCE(NEW.id, 0)
          AND EXTRACT(YEAR FROM data_reserva) = EXTRACT(YEAR FROM NEW.data_reserva)
          AND EXTRACT(MONTH FROM data_reserva) = EXTRACT(MONTH FROM NEW.data_reserva);

        IF v_total_mes >= v_limite THEN
            RAISE EXCEPTION 'LIMITE_RESERVAS: O morador já atingiu o limite de % reservas para o mês %/%.',
                v_limite,
                EXTRACT(MONTH FROM NEW.data_reserva),
                EXTRACT(YEAR FROM NEW.data_reserva);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_limite_mensal ON reserva;

CREATE TRIGGER trg_validar_limite_mensal
    BEFORE INSERT OR UPDATE ON reserva
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_limite_mensal_reservas();

CREATE TABLE IF NOT EXISTS notificacao (
    id                  SERIAL PRIMARY KEY,
    id_usuario          INTEGER NOT NULL,
    tipo                VARCHAR(50) NOT NULL,
    titulo              VARCHAR(150) NOT NULL,
    mensagem            TEXT NOT NULL,
    id_reserva          INTEGER,
    lida_em             TIMESTAMP,
    criado_em           TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notificacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacao_reserva FOREIGN KEY (id_reserva)
        REFERENCES reserva (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notificacao_usuario
    ON notificacao (id_usuario, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_notificacao_lida
    ON notificacao (id_usuario, lida_em);

COMMENT ON TABLE notificacao IS 'Notificações do sistema para solicitações, decisões de reserva e eventos relevantes.';

DROP VIEW IF EXISTS vw_solicitacoes_reserva;
DROP VIEW IF EXISTS vw_metricas_dashboard;
DROP VIEW IF EXISTS vw_disponibilidade_areas;
DROP VIEW IF EXISTS vw_reservas_ativas;

CREATE OR REPLACE VIEW vw_reservas_ativas AS
SELECT
    r.id                AS reserva_id,
    r.data_reserva,
    r.hora_inicio,
    r.hora_fim,
    r.status_reserva,
    r.data_solicitacao,
    r.data_decisao,
    r.motivo_decisao,
    u.id                AS morador_id,
    u.nome_completo     AS morador_nome,
    u.apartamento,
    u.bloco,
    a.id                AS area_id,
    a.nome_area,
    a.capacidade_maxima,
    a.valor_reserva
FROM reserva r
    INNER JOIN usuario u ON r.id_morador = u.id
    INNER JOIN area_comum a ON r.id_area_comum = a.id
WHERE r.status_reserva = 'CONFIRMADA'
ORDER BY r.data_reserva, r.hora_inicio;

CREATE OR REPLACE VIEW vw_disponibilidade_areas AS
SELECT
    a.id                AS area_id,
    a.nome_area,
    a.descricao,
    a.capacidade_maxima,
    a.valor_reserva,
    a.status            AS status_area,
    r.data_reserva,
    r.hora_inicio,
    r.hora_fim,
    r.status_reserva
FROM area_comum a
    LEFT JOIN reserva r ON a.id = r.id_area_comum
        AND r.status_reserva = 'CONFIRMADA'
        AND r.data_reserva >= CURRENT_DATE
WHERE a.status = 'DISPONIVEL'
ORDER BY a.nome_area, r.data_reserva, r.hora_inicio;

CREATE OR REPLACE VIEW vw_metricas_dashboard AS
SELECT
    (SELECT COUNT(*) FROM usuario WHERE tipo_usuario = 'MORADOR' AND status = 'ATIVO')
        AS total_moradores_ativos,
    (SELECT COUNT(*) FROM usuario WHERE tipo_usuario = 'ADMINISTRADOR' AND status = 'ATIVO')
        AS total_administradores_ativos,
    (SELECT COUNT(*) FROM usuario WHERE tipo_usuario = 'SINDICO' AND status = 'ATIVO')
        AS total_sindicos_ativos,
    (SELECT COUNT(*) FROM area_comum WHERE status = 'DISPONIVEL')
        AS total_areas_disponiveis,
    (SELECT COUNT(*) FROM reserva WHERE status_reserva = 'CONFIRMADA' AND data_reserva >= CURRENT_DATE)
        AS total_reservas_futuras,
    (SELECT COUNT(*) FROM reserva WHERE status_reserva = 'PENDENTE' AND data_reserva >= CURRENT_DATE)
        AS total_solicitacoes_pendentes,
    (SELECT COUNT(*) FROM reserva
     WHERE status_reserva = 'CONFIRMADA'
       AND EXTRACT(YEAR FROM data_reserva) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM data_reserva) = EXTRACT(MONTH FROM CURRENT_DATE))
        AS reservas_mes_atual;

CREATE OR REPLACE VIEW vw_solicitacoes_reserva AS
SELECT
    r.id                AS reserva_id,
    r.data_reserva,
    r.hora_inicio,
    r.hora_fim,
    r.status_reserva,
    r.data_solicitacao,
    r.data_decisao,
    r.motivo_decisao,
    r.observacao_solicitacao,
    u.id                AS morador_id,
    u.nome_completo     AS morador_nome,
    u.apartamento,
    u.bloco,
    a.id                AS area_id,
    a.nome_area
FROM reserva r
    INNER JOIN usuario u ON r.id_morador = u.id
    INNER JOIN area_comum a ON r.id_area_comum = a.id
WHERE r.status_reserva IN ('PENDENTE', 'CONFIRMADA', 'REPROVADA', 'CANCELADA')
ORDER BY r.data_solicitacao DESC;
