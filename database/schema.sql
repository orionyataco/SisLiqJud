-- Esquema do Banco de Dados para Sistema de Liquidação Judicial
-- Conforme Ato Conjunto Nº 706/2025-GP/CGJ/TJAP e Lei 14.905/2024

-- Tabela de Índices de Correção Monetária (IPCA-E)
-- Aplicação: Fazenda Pública pré-EC 113, Débitos em Geral pré-Lei 14.905/2024
CREATE TABLE IF NOT EXISTS indice_ipca_e (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Taxa SELIC (Forma Simples)
-- Aplicação: Fazenda Pública pós-EC 113 (Art. 1º, IV Ato 706/2025)
CREATE TABLE IF NOT EXISTS indice_selic (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela IPCA (Lei 14.905/2024)
-- Aplicação: Débitos em Geral pós-Lei 14.905/2024 (Art. 1º, II Ato 706/2025)
CREATE TABLE IF NOT EXISTS indice_ipca (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela INPC
-- Aplicação: Quando sentença ou contrato previr (Art. 1º, I Ato 706/2025)
CREATE TABLE IF NOT EXISTS indice_inpc (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Juros de Mora
-- Aplicação: 1% a.m. pré-Lei 14.905/2024; Taxa Legal = SELIC - IPCA pós (Art. 406 CC)
CREATE TABLE IF NOT EXISTS indice_juros (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    tipo_indice VARCHAR(50) DEFAULT 'JUROS_1PCT', -- 'JUROS_1PCT', 'TAXA_LEGAL'
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Juros de Poupança
-- Aplicação: Fazenda Pública pré-EC 113 (Art. 1º, V Ato 706/2025)
CREATE TABLE IF NOT EXISTS indice_poupanca (
    id SERIAL PRIMARY KEY,
    competencia DATE UNIQUE NOT NULL,
    valor_mensal DECIMAL(12, 6) NOT NULL,
    fator_acumulado DECIMAL(12, 10) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Armazenar os Processos (Cálculos Salvos)
CREATE TABLE IF NOT EXISTS processos (
    id SERIAL PRIMARY KEY,
    numero_processo VARCHAR(50) NOT NULL,
    modalidade VARCHAR(20) DEFAULT 'SIMPLES', -- 'SIMPLES', 'BANCOS', 'FAZENDA_PUBLICA'
    nome_servidor VARCHAR(255),
    data_ajuizamento DATE NOT NULL,
    data_citacao DATE NOT NULL,
    percentual_honorarios DECIMAL(5, 2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Lançamentos Financeiros
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
CREATE INDEX idx_ipca_e_comp ON indice_ipca_e(competencia);
CREATE INDEX idx_selic_comp ON indice_selic(competencia);
CREATE INDEX idx_ipca_comp ON indice_ipca(competencia);
CREATE INDEX idx_inpc_comp ON indice_inpc(competencia);
CREATE INDEX idx_poupanca_comp ON indice_poupanca(competencia);
CREATE INDEX idx_lanc_proc ON lancamentos_financeiros(processo_id);
