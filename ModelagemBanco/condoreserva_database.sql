-- =============================================================================
-- BANCO DE DADOS: CondoReserva
-- Sistema de Gestão de Reservas de Áreas Comuns em Condomínio
-- SGBD: PostgreSQL 15+
-- =============================================================================
-- Baseado no Diagrama de Classes UML e nos Casos de Uso (UC01 a UC08)
-- Herança: Usuario (abstrato) -> Morador, Administrador, Sindico
-- Estratégia de herança: Single Table Inheritance (STI)
--   Motivo: simplifica queries de login/autenticação (UC01), permite uma
--   única tabela de usuários com coluna discriminadora "tipo_usuario",
--   e os campos específicos de cada perfil ficam como colunas opcionais.
-- =============================================================================

BEGIN;

-- =============================================
-- 1. TIPOS ENUMERADOS (ENUMs)
-- =============================================

-- Tipo de usuário (discriminador da herança)
CREATE TYPE tipo_usuario_enum AS ENUM ('MORADOR', 'ADMINISTRADOR', 'SINDICO');

-- Status geral de entidades (Usuário, Área Comum)
CREATE TYPE status_geral_enum AS ENUM ('ATIVO', 'INATIVO');

-- Status específico de uma reserva
CREATE TYPE status_reserva_enum AS ENUM ('CONFIRMADA', 'CANCELADA');

-- Status de disponibilidade da área comum
CREATE TYPE status_area_enum AS ENUM ('DISPONIVEL', 'INDISPONIVEL');


-- =============================================
-- 2. TABELA: usuario
-- =============================================
-- Representa a classe abstrata "Usuario" e suas especializações
-- (Morador, Administrador, Sindico) via Single Table Inheritance.
-- 
-- Campos comuns: id, nome_completo, email, senha, telefone, status
-- Campos do Morador: apartamento, bloco
-- Campos do Administrador: permissoes_acesso
-- Campos do Síndico: herda de Administrador (nenhum campo extra)
--
-- Referências:
--   UC01 (Login), UC02 (Logout), UC03 (Gerenciar Perfil),
--   UC06 (Gerenciar Moradores), UC08 (Gerenciar Administradores)
-- =============================================

CREATE TABLE usuario (
    id                  SERIAL          PRIMARY KEY,
    tipo_usuario        tipo_usuario_enum NOT NULL,
    nome_completo       VARCHAR(200)    NOT NULL,
    email               VARCHAR(254)    NOT NULL,
    senha               VARCHAR(255)    NOT NULL,  -- hash bcrypt/argon2
    telefone            VARCHAR(20),
    status              status_geral_enum NOT NULL DEFAULT 'ATIVO',

    -- Campos específicos do MORADOR
    apartamento         VARCHAR(20),
    bloco               VARCHAR(20),

    -- Campos específicos do ADMINISTRADOR / SÍNDICO
    -- Array de permissões (ex: '{GERENCIAR_MORADORES, GERENCIAR_AREAS, GERENCIAR_RESERVAS}')
    permissoes_acesso   TEXT[],

    -- Controle de tentativas de login (UC01 - regra: bloquear após 3 falhas por 15 min)
    tentativas_login    SMALLINT        NOT NULL DEFAULT 0,
    bloqueado_ate       TIMESTAMP,

    -- Auditoria
    criado_em           TIMESTAMP       NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uk_usuario_email UNIQUE (email),

    -- Validação: Morador DEVE ter apartamento e bloco
    CONSTRAINT chk_morador_campos CHECK (
        tipo_usuario <> 'MORADOR'
        OR (apartamento IS NOT NULL AND bloco IS NOT NULL)
    ),

    -- Validação: tentativas de login entre 0 e 3
    CONSTRAINT chk_tentativas_login CHECK (tentativas_login BETWEEN 0 AND 3)
);

-- Índices para performance
CREATE INDEX idx_usuario_tipo ON usuario (tipo_usuario);
CREATE INDEX idx_usuario_status ON usuario (status);
CREATE INDEX idx_usuario_email_status ON usuario (email, status);
CREATE INDEX idx_usuario_bloco_apto ON usuario (bloco, apartamento) WHERE tipo_usuario = 'MORADOR';

-- Comentários
COMMENT ON TABLE usuario IS 'Tabela unificada de usuários (STI). Armazena Moradores, Administradores e Síndicos.';
COMMENT ON COLUMN usuario.tipo_usuario IS 'Discriminador de herança: MORADOR, ADMINISTRADOR ou SINDICO.';
COMMENT ON COLUMN usuario.senha IS 'Hash da senha (bcrypt/argon2). Mínimo 8 caracteres no input, com letras maiúsculas, minúsculas, números e especiais.';
COMMENT ON COLUMN usuario.apartamento IS 'Número do apartamento. Obrigatório apenas para MORADOR.';
COMMENT ON COLUMN usuario.bloco IS 'Bloco do condomínio. Obrigatório apenas para MORADOR.';
COMMENT ON COLUMN usuario.permissoes_acesso IS 'Array de permissões do administrador/síndico. Ex: {GERENCIAR_MORADORES, GERENCIAR_AREAS, GERENCIAR_RESERVAS}.';
COMMENT ON COLUMN usuario.tentativas_login IS 'Contador de tentativas de login falhas. Reseta ao logar com sucesso. Bloqueia a conta após 3.';
COMMENT ON COLUMN usuario.bloqueado_ate IS 'Timestamp até quando a conta está bloqueada após 3 tentativas falhas (15 minutos).';


-- =============================================
-- 3. TABELA: area_comum
-- =============================================
-- Representa as áreas comuns do condomínio disponíveis para reserva.
-- Gerenciada por Administrador e Síndico (UC07).
--
-- Referências:
--   UC04 (Consultar Disponibilidade), UC05 (Gerenciar Reserva),
--   UC07 (Gerenciar Áreas Comuns)
-- =============================================

CREATE TABLE area_comum (
    id                  SERIAL          PRIMARY KEY,
    nome_area           VARCHAR(150)    NOT NULL,
    descricao           TEXT,
    capacidade_maxima   INTEGER         NOT NULL,
    regras_uso          TEXT,
    valor_reserva       NUMERIC(10, 2)  DEFAULT 0.00,
    status              status_area_enum NOT NULL DEFAULT 'DISPONIVEL',

    -- Auditoria
    criado_em           TIMESTAMP       NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uk_area_comum_nome UNIQUE (nome_area),
    CONSTRAINT chk_capacidade_positiva CHECK (capacidade_maxima > 0),
    CONSTRAINT chk_valor_reserva_positivo CHECK (valor_reserva >= 0)
);

-- Índices
CREATE INDEX idx_area_comum_status ON area_comum (status);

-- Comentários
COMMENT ON TABLE area_comum IS 'Áreas comuns do condomínio: churrasqueiras, salões de festa, quadras, piscinas, etc.';
COMMENT ON COLUMN area_comum.nome_area IS 'Nome único da área (ex: Churrasqueira A, Salão de Festas).';
COMMENT ON COLUMN area_comum.valor_reserva IS 'Valor cobrado pela reserva (pode ser 0 para áreas gratuitas).';
COMMENT ON COLUMN area_comum.regras_uso IS 'Regras de utilização da área (texto livre).';


-- =============================================
-- 4. TABELA: reserva
-- =============================================
-- Representa as reservas de áreas comuns feitas por moradores.
-- Relaciona Morador (usuario) <-> AreaComum.
--
-- Referências:
--   UC04 (Consultar Disponibilidade), UC05 (Gerenciar Reserva)
-- =============================================

CREATE TABLE reserva (
    id                  SERIAL          PRIMARY KEY,
    id_morador          INTEGER         NOT NULL,
    id_area_comum       INTEGER         NOT NULL,
    data_reserva        DATE            NOT NULL,
    hora_inicio         TIME            NOT NULL,
    hora_fim            TIME            NOT NULL,
    status_reserva      status_reserva_enum NOT NULL DEFAULT 'CONFIRMADA',
    data_solicitacao    TIMESTAMP       NOT NULL DEFAULT NOW(),
    data_cancelamento   TIMESTAMP,

    -- FK para quem cancelou (pode ser o próprio morador, admin ou síndico)
    id_cancelado_por    INTEGER,

    -- Auditoria
    criado_em           TIMESTAMP       NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_reserva_morador FOREIGN KEY (id_morador)
        REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_area_comum FOREIGN KEY (id_area_comum)
        REFERENCES area_comum (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_cancelado_por FOREIGN KEY (id_cancelado_por)
        REFERENCES usuario (id) ON DELETE SET NULL,

    -- Hora fim deve ser depois de hora início
    CONSTRAINT chk_horario_valido CHECK (hora_fim > hora_inicio),

    -- Data da reserva não pode ser no passado (verificação básica)
    CONSTRAINT chk_data_reserva_futura CHECK (data_reserva >= CURRENT_DATE),

    -- Se cancelada, deve ter data de cancelamento
    CONSTRAINT chk_cancelamento_consistente CHECK (
        (status_reserva = 'CANCELADA' AND data_cancelamento IS NOT NULL)
        OR (status_reserva = 'CONFIRMADA' AND data_cancelamento IS NULL)
    )
);

-- Índice UNIQUE para evitar reservas sobrepostas na mesma área e horário
-- (Regra de negócio UC05: "Não é possível reservar duas áreas no mesmo horário")
-- Nota: este índice parcial garante que não existam duas reservas CONFIRMADAS
-- para a mesma área, na mesma data, com horários que se sobreponham.
-- A validação completa de sobreposição é feita via trigger/função.
CREATE UNIQUE INDEX uk_reserva_area_data_horario
    ON reserva (id_area_comum, data_reserva, hora_inicio, hora_fim)
    WHERE status_reserva = 'CONFIRMADA';

-- Índices para consultas frequentes
CREATE INDEX idx_reserva_morador ON reserva (id_morador);
CREATE INDEX idx_reserva_area ON reserva (id_area_comum);
CREATE INDEX idx_reserva_data ON reserva (data_reserva);
CREATE INDEX idx_reserva_status ON reserva (status_reserva);
CREATE INDEX idx_reserva_morador_status ON reserva (id_morador, status_reserva);
CREATE INDEX idx_reserva_area_data_status ON reserva (id_area_comum, data_reserva, status_reserva);

-- Comentários
COMMENT ON TABLE reserva IS 'Reservas de áreas comuns feitas por moradores. Admins e síndicos podem cancelar qualquer reserva.';
COMMENT ON COLUMN reserva.id_morador IS 'Morador que realizou a reserva. FK para usuario.id (tipo_usuario = MORADOR).';
COMMENT ON COLUMN reserva.id_cancelado_por IS 'Usuário que cancelou a reserva (pode ser o morador, admin ou síndico). NULL se não cancelada.';
COMMENT ON COLUMN reserva.data_cancelamento IS 'Timestamp do cancelamento. Preenchido apenas quando status = CANCELADA.';


-- =============================================
-- 5. TABELA: log_atividade (auditoria)
-- =============================================
-- Tabela de log para rastrear ações importantes do sistema.
-- Útil para o dashboard do Síndico e auditoria geral.
-- =============================================

CREATE TABLE log_atividade (
    id                  SERIAL          PRIMARY KEY,
    id_usuario          INTEGER,
    acao                VARCHAR(100)    NOT NULL,
    entidade            VARCHAR(50)     NOT NULL,  -- 'USUARIO', 'AREA_COMUM', 'RESERVA'
    id_entidade         INTEGER,
    detalhes            JSONB,
    ip_address          INET,
    criado_em           TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- FK
    CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_log_usuario ON log_atividade (id_usuario);
CREATE INDEX idx_log_acao ON log_atividade (acao);
CREATE INDEX idx_log_criado_em ON log_atividade (criado_em DESC);
CREATE INDEX idx_log_entidade ON log_atividade (entidade, id_entidade);

-- Comentários
COMMENT ON TABLE log_atividade IS 'Log de auditoria para ações do sistema: login, CRUD de moradores, reservas, áreas, etc.';
COMMENT ON COLUMN log_atividade.acao IS 'Ação realizada. Ex: LOGIN, LOGOUT, CRIAR_RESERVA, CANCELAR_RESERVA, EDITAR_MORADOR, etc.';
COMMENT ON COLUMN log_atividade.entidade IS 'Tipo de entidade afetada: USUARIO, AREA_COMUM, RESERVA.';
COMMENT ON COLUMN log_atividade.detalhes IS 'Detalhes adicionais em JSON (ex: campos alterados, motivo do cancelamento).';


-- =============================================
-- 6. FUNÇÃO: Validar sobreposição de reservas
-- =============================================
-- Garante que não existam duas reservas confirmadas
-- na mesma área e com horários sobrepostos (UC05).
-- =============================================

CREATE OR REPLACE FUNCTION fn_validar_sobreposicao_reserva()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica sobreposição apenas para reservas CONFIRMADAS
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

CREATE TRIGGER trg_validar_sobreposicao_reserva
    BEFORE INSERT OR UPDATE ON reserva
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_sobreposicao_reserva();

COMMENT ON FUNCTION fn_validar_sobreposicao_reserva() IS 'Valida que não existem reservas confirmadas com horários sobrepostos na mesma área e data.';


-- =============================================
-- 7. FUNÇÃO: Atualizar campo "atualizado_em"
-- =============================================

CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuario_atualizado_em
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_area_comum_atualizado_em
    BEFORE UPDATE ON area_comum
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_reserva_atualizado_em
    BEFORE UPDATE ON reserva
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();


-- =============================================
-- 8. FUNÇÃO: Validar limite mensal de reservas
-- =============================================
-- Regra de negócio UC05: moradores podem ter um limite
-- máximo de reservas por mês.
-- O limite é configurável via tabela configuracao.
-- =============================================

CREATE TABLE configuracao (
    chave               VARCHAR(100)    PRIMARY KEY,
    valor               VARCHAR(255)    NOT NULL,
    descricao           TEXT,
    atualizado_em       TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO configuracao (chave, valor, descricao) VALUES
    ('LIMITE_RESERVAS_MENSAL', '5', 'Número máximo de reservas por morador por mês.'),
    ('ANTECEDENCIA_MINIMA_CANCELAMENTO_HORAS', '24', 'Horas mínimas de antecedência para cancelar uma reserva.'),
    ('TEMPO_BLOQUEIO_LOGIN_MINUTOS', '15', 'Tempo de bloqueio da conta após 3 tentativas de login falhas.');

COMMENT ON TABLE configuracao IS 'Parâmetros configuráveis do sistema (limites, prazos, regras de negócio).';

CREATE OR REPLACE FUNCTION fn_validar_limite_mensal_reservas()
RETURNS TRIGGER AS $$
DECLARE
    v_limite INTEGER;
    v_total_mes INTEGER;
BEGIN
    -- Só valida no INSERT de reservas confirmadas
    IF TG_OP = 'INSERT' AND NEW.status_reserva = 'CONFIRMADA' THEN
        -- Busca o limite configurado
        SELECT COALESCE(valor::INTEGER, 5)
        INTO v_limite
        FROM configuracao
        WHERE chave = 'LIMITE_RESERVAS_MENSAL';

        -- Conta reservas confirmadas do morador no mês
        SELECT COUNT(*)
        INTO v_total_mes
        FROM reserva
        WHERE id_morador = NEW.id_morador
          AND status_reserva = 'CONFIRMADA'
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

CREATE TRIGGER trg_validar_limite_mensal
    BEFORE INSERT ON reserva
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_limite_mensal_reservas();


-- =============================================
-- 9. VIEWS ÚTEIS
-- =============================================

-- View: reservas ativas com dados completos (para dashboards)
CREATE VIEW vw_reservas_ativas AS
SELECT
    r.id                AS reserva_id,
    r.data_reserva,
    r.hora_inicio,
    r.hora_fim,
    r.status_reserva,
    r.data_solicitacao,
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

COMMENT ON VIEW vw_reservas_ativas IS 'Reservas confirmadas com dados do morador e da área. Usado nos dashboards do morador, admin e síndico.';


-- View: disponibilidade de áreas (UC04)
CREATE VIEW vw_disponibilidade_areas AS
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

COMMENT ON VIEW vw_disponibilidade_areas IS 'Áreas disponíveis com suas reservas futuras confirmadas. Base para a tela de consulta de disponibilidade (UC04).';


-- View: métricas para o dashboard do admin/síndico
CREATE VIEW vw_metricas_dashboard AS
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
    (SELECT COUNT(*) FROM reserva
     WHERE status_reserva = 'CONFIRMADA'
       AND EXTRACT(YEAR FROM data_reserva) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM data_reserva) = EXTRACT(MONTH FROM CURRENT_DATE))
        AS reservas_mes_atual;

COMMENT ON VIEW vw_metricas_dashboard IS 'Métricas consolidadas para os dashboards do Administrador e Síndico.';


-- =============================================
-- 10. DADOS INICIAIS (seed)
-- =============================================

-- Síndico padrão do sistema (senha fictícia - hash bcrypt de "Senha@123")
INSERT INTO usuario (tipo_usuario, nome_completo, email, senha, telefone, status, permissoes_acesso)
VALUES (
    'SINDICO',
    'Síndico Master',
    'sindico@condoreserva.com',
    '$2a$12$LJ3m4ys3KzT8X5vWdQ8qxOQZzBnRlGkUvQPdZcWj5RfDkWxQwCmPe',  -- placeholder
    '(11) 99999-0001',
    'ATIVO',
    ARRAY['GERENCIAR_MORADORES', 'GERENCIAR_AREAS', 'GERENCIAR_RESERVAS', 'GERENCIAR_ADMINISTRADORES']
);

-- Algumas áreas comuns de exemplo
INSERT INTO area_comum (nome_area, descricao, capacidade_maxima, regras_uso, valor_reserva, status) VALUES
    ('Churrasqueira A', 'Churrasqueira coberta com espaço para 20 pessoas, pia e bancada.', 20, 'Uso até 22h. Limpar após o uso. Proibido som alto após 20h.', 50.00, 'DISPONIVEL'),
    ('Churrasqueira B', 'Churrasqueira ao ar livre com espaço para 15 pessoas.', 15, 'Uso até 22h. Limpar após o uso.', 50.00, 'DISPONIVEL'),
    ('Salão de Festas', 'Salão climatizado com capacidade para 80 pessoas, com cozinha de apoio.', 80, 'Reservar com 7 dias de antecedência. Caução de R$200. Limpar após o uso.', 200.00, 'DISPONIVEL'),
    ('Quadra Poliesportiva', 'Quadra para futebol, vôlei e basquete.', 20, 'Uso de tênis adequado obrigatório. Reservas de 1h por vez.', 0.00, 'DISPONIVEL'),
    ('Piscina', 'Piscina adulto e infantil com deck.', 40, 'Uso de touca obrigatório. Crianças menores de 12 anos acompanhadas por responsável.', 0.00, 'DISPONIVEL'),
    ('Sala de Jogos', 'Sala com mesa de sinuca, ping-pong e pebolim.', 10, 'Horário: 8h às 22h. Proibido alimentos.', 0.00, 'DISPONIVEL'),
    ('Espaço Gourmet', 'Espaço com cozinha completa e área de convivência.', 25, 'Reservar com 3 dias de antecedência. Limpar após o uso.', 100.00, 'DISPONIVEL'),
    ('Academia', 'Academia com equipamentos de musculação e cardio.', 15, 'Uso de toalha obrigatório. Não é possível reservar (uso livre).', 0.00, 'DISPONIVEL');


COMMIT;


-- =============================================
-- RESUMO DA MODELAGEM
-- =============================================
--
-- TABELAS:
--   1. usuario          → Usuários do sistema (STI: Morador/Administrador/Síndico)
--   2. area_comum       → Áreas comuns disponíveis para reserva
--   3. reserva          → Reservas de áreas comuns por moradores
--   4. log_atividade    → Log de auditoria de ações do sistema
--   5. configuracao     → Parâmetros configuráveis do sistema
--
-- RELACIONAMENTOS:
--   usuario (1) ──── (0..*) reserva          (morador faz reservas)
--   area_comum (1) ── (0..*) reserva          (área contém reservas)
--   usuario (1) ──── (0..*) log_atividade    (usuário gera logs)
--
-- TRIGGERS:
--   1. trg_validar_sobreposicao_reserva   → Impede reservas sobrepostas
--   2. trg_validar_limite_mensal          → Limita reservas por mês
--   3. trg_*_atualizado_em                → Auto-update do timestamp
--
-- VIEWS:
--   1. vw_reservas_ativas                 → Reservas confirmadas (dashboards)
--   2. vw_disponibilidade_areas           → Disponibilidade de áreas (UC04)
--   3. vw_metricas_dashboard              → Métricas consolidadas (admin/síndico)
--
-- CASOS DE USO COBERTOS:
--   UC01 (Login)        → usuario.email, senha, tentativas_login, bloqueado_ate
--   UC02 (Logout)       → log_atividade (registro de logout)
--   UC03 (Perfil)       → usuario (edição de dados pessoais e senha)
--   UC04 (Disponib.)    → vw_disponibilidade_areas, area_comum, reserva
--   UC05 (Reservas)     → reserva, triggers de validação
--   UC06 (Moradores)    → usuario WHERE tipo_usuario = 'MORADOR'
--   UC07 (Áreas)        → area_comum (CRUD completo)
--   UC08 (Admins)       → usuario WHERE tipo_usuario IN ('ADMINISTRADOR','SINDICO')
-- =============================================
