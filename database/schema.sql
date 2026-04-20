-- Esquema do Banco de Dados para Sistema de Liquidação Judicial

-- Tabela de Índices de Correção Monetária (IPCA-E)
CREATE TABLE IF NOT EXISTS indice_ipca_e (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL, -- Primeiro dia do mês (Ex: 2023-01-01)
    valor_mensal DECIMAL(12, 6) NOT NULL, -- Valor percentual do mês
    fator_acumulado DECIMAL(12, 10) NOT NULL, -- Fator para multiplicação direta
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Taxa SELIC (EC 113/2021)
CREATE TABLE IF NOT EXISTS indice_selic (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Juros de Mora (0,5% am, Poupança ou outros)
CREATE TABLE IF NOT EXISTS indice_juros (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    tipo_indice VARCHAR(50) DEFAULT 'POUPANCA', -- 'POUPANCA', 'SELIC', '0.5%'
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Armazenar os Processos (Cálculos Salvos)
CREATE TABLE IF NOT EXISTS processos (
    id SERIAL PRIMARY KEY,
    numero_processo VARCHAR(50) NOT NULL,
    nome_servidor VARCHAR(255),
    data_ajuizamento DATE NOT NULL,
    data_citacao DATE NOT NULL,
    percentual_honorarios DECIMAL(5, 2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Lançamentos Financeiros (O que foi pago vs O que era devido)
CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
    id SERIAL PRIMARY KEY,
    processo_id INTEGER REFERENCES processos(id) ON DELETE CASCADE,
    competencia DATE NOT NULL,
    valor_devido DECIMAL(15, 2) NOT NULL,
    valor_recebido DECIMAL(15, 2) NOT NULL,
    is_tributavel BOOLEAN DEFAULT TRUE,
    descricao VARCHAR(100)
);

-- Índices para performance
CREATE INDEX idx_ipca_comp ON indice_ipca_e(competencia);
CREATE INDEX idx_selic_comp ON indice_selic(competencia);
CREATE INDEX idx_lanc_proc ON lancamentos_financeiros(processo_id);
