# Regras de Cálculo Judicial — TJAP (Tribunal de Justiça do Amapá)

## Legislação Aplicável

### Marco Regulatório Principal

- **Ato Conjunto Nº 706/2025-GP/CGJ/TJAP** (vigente desde 27/08/2025) — Dispõe sobre a atualização dos valores decorrentes de processos judiciais, institui as tabelas oficiais de atualização monetária e juros no âmbito do TJAP. Revoga o Ato Conjunto Nº 279/2012.
- **Lei Nº 14.905/2024** — Altera o Código Civil para dispor sobre atualização monetária e juros (vigência a partir de 30/08/2024).
- **Emenda Constitucional Nº 113/2021** (09/12/2021) — Estabelece SELIC para débitos da Fazenda Pública.
- **Lei Nº 10.406/2002** — Código Civil (art. 389, 395, 404, 406).
- **Lei Nº 6.899/1981** — Correção monetária em débitos oriundos de decisão judicial.
- **Decreto Nº 86.649/1981** — Regulamenta a Lei 6.899/1981.
- **Resolução CNJ Nº 303/2019** — Precatórios e procedimentos operacionais.

---

## Modalidades de Cálculo

O sistema suporta três modalidades, cada uma com regras específicas de correção monetária e juros:

### 1. Cálculos Simples (Débitos em Geral — Particulares)

| Período | Correção Monetária | Juros de Mora |
|---------|-------------------|---------------|
| Até 29/08/2024 | IPCA-E (ou INPC se previsto em contrato/sentença) | 1% a.m. (art. 406 CC anterior) |
| A partir de 30/08/2024 | IPCA (Lei 14.905/2024, art. 389 § único) | Taxa legal = SELIC acum. simples − IPCA (art. 406 CC novo) |

**Fonte:** Ato Conjunto 706/2025, Art. 1º, II e VI.

### 2. Bancos e Instituições Financeiras

| Período | Correção Monetária | Juros de Mora |
|---------|-------------------|---------------|
| Até 29/08/2024 | IPCA-E | 12% a.a. (art. 161 CTN c/c Súmula 381 STJ) ou contratuais |
| A partir de 30/08/2024 | IPCA | Taxa legal (SELIC − IPCA forma simples) |

**Nota:** Aplicam-se as regras do CC com as exclusões do art. 3º da Lei 14.905/2024 (contratos entre PJ, títulos de crédito, instituições financeiras não se submetem ao Decreto 22.626/1933 — Lei de Usura).

**Fonte:** Lei 14.905/2024, Art. 3º.

### 3. Fazenda Pública

| Período | Correção Monetária | Juros de Mora |
|---------|-------------------|---------------|
| Até 08/12/2021 (pré-EC 113) | IPCA-E | Juros de Poupança (0,5% a.m.) |
| A partir de 09/12/2021 (EC 113) | SELIC acumulada (forma simples) — já engloba correção e juros | — |
| Honorários e custas | Mesma tabela do débito principal | Art. 6º, Ato 706/2025 |

**Fonte:** Ato Conjunto 706/2025, Art. 1º, III, IV e V; EC 113/2021.

---

## Metodologia de Cálculo

### 1. Atualização Monetária — Critério "Virada do Mês"

Conforme Art. 2º do Ato Conjunto 706/2025 e Lei 6.899/1981:

> A atualização monetária se aplica na **"virada do mês"**, não pro rata, salvo determinação em contrário.

Isso significa que:
- O índice de correção de cada mês é aplicado integralmente sobre o valor devido naquele mês
- Não há proporcionalização por dias (pro rata die)
- O mesmo critério se aplica aos juros de mora

### 2. Juros Simples — Capitalização Simples

Conforme Art. 3º do Ato Conjunto 706/2025:

> Os juros moratórios serão calculados com **capitalização simples**, salvo expressa determinação judicial em sentido contrário.

**É proibido anatocismo (juros sobre juros).**

### 3. SELIC Acumulada (Forma Simples)

Para débitos fazendários pós-EC 113/2021, a SELIC é aplicada de forma **simples (não composta)**. O fator SELIC acumulado é a soma das taxas mensais, não o produto.

**Fonte:** Ato Conjunto 706/2025, Art. 1º, IV; Resolução CNJ 303/2019.

### 4. Taxa Legal (pós Lei 14.905/2024)

A taxa legal corresponde a:

```
Taxa Legal = SELIC acumulada (forma simples) − IPCA acumulado (mesmo perído)
```

Se o resultado for negativo, considera-se **0 (zero)** para o período.

**Fonte:** Lei 14.905/2024, Art. 406, §§ 1º e 3º.

---

## Tabelas Oficiais do TJAP

As tabelas são disponibilizadas no portal do TJAP, na página da Contadoria Única:
https://www.tjap.jus.br/portal/contadoria-unica-legislacao.html

### Índices disponíveis:

| Tabela | Sigla | Aplicação |
|--------|-------|-----------|
| Débito em Geral (INPC) | INPC | Quando sentença ou contrato previr |
| Débito em Geral (IPCA) | IPCA | Débitos comuns pós-Lei 14.905/2024 |
| IPCA-E | IPCA-E | Fazenda Pública pré-EC 113 |
| SELIC Acumulada (Forma Simples) | SELIC | Fazenda Pública pós-EC 113 |
| Juros de Poupança | Poupança | Fazenda Pública pré-EC 113 |
| Juros Legais | Juros | 1% a.m. (até 29/08/2024) ou taxa legal (pós) |

---

## Verbas e Reflexos

### Reflexos de 13º Salário e Férias

No âmbito do TJAP, para cálculos envolvendo vínculo estatutário ou celetista:

- **13º Salário:** 1/12 por mês trabalhado ou com diferença salarial no ano
- **Férias:** 1/12 por mês + 1/3 constitucional
- Base de cálculo: diferença salarial do mês (vencimento base)

### Previdência Social (RPPS/RGPS)

| Período | Alíquota |
|---------|----------|
| Até 31/12/2020 | 11% |
| A partir de 01/01/2021 | 14% (EC 103/2019) |

### Imposto de Renda (RRA)

O IR sobre Rendimentos Recebidos Acumuladamente (RRA) deve ser calculado conforme:
- **IN RFB Nº 1.500/2014** — tabela progressiva mensal com divisão pelo número de meses
- O sistema atualmente aplica 15% fixo como simplificação

---

## Fluxo de Decisão do Calculador

```
                      ┌─────────────────────────────┐
                      │   Qual a modalidade?         │
                      └──────────┬──────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
  │ Cálculo      │      │ Bancos/Fin.  │      │ Fazenda Pública  │
  │ Simples      │      │              │      │                  │
  └──────┬───────┘      └──────┬───────┘      └────────┬─────────┘
         │                     │                        │
         ▼                     ▼                        ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
  │ Data competência │  │ Data competência│  │ Data competência     │
  │ ≤ 29/08/2024?    │  │ ≤ 29/08/2024?   │  │ ≤ 08/12/2021?        │
  ├───────┬─────────┤  ├───────┬─────────┤  ├──────────┬───────────┤
  │ Sim   │ Não     │  │ Sim   │ Não     │  │ Sim      │ Não       │
  │       │         │  │       │         │  │          │           │
  │IPCA-E │ IPCA   │  │IPCA-E │IPCA    │  │IPCA-E   │ SELIC     │
  │+      │+       │  │+      │+       │  │+ Juros  │ (já inclui │
  │1% a.m.│Tx.Legal│  │12% a.a│Tx.Legal│  │Poupança │ correção)  │
  └───────┴─────────┘  └───────┴─────────┘  └──────────┴───────────┘
```

---

## Referências

1. Ato Conjunto Nº 706/2025: https://sig.tjap.jus.br/ato_normativo_grid_ato_normativo_vertical.php?var_ato=54692
2. Lei 14.905/2024: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14905.htm
3. EC 113/2021: https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc113.htm
4. Lei 6.899/1981: https://www.planalto.gov.br/ccivil_03/leis/L6899.htm
5. Resolução CNJ 303/2019: https://atos.cnj.jus.br/atos/detalhar/3130
