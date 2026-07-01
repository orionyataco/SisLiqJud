# SisLiqJud — Sistema de Liquidação Judicial

**SisLiqJud** é uma aplicação web para cálculo de liquidação de sentença na Justiça do Trabalho brasileira. Ela apura diferenças salariais entre valores devidos e recebidos, aplica correção monetária (IPCA-E, SELIC), juros de mora, contribuição previdenciária, imposto de renda (RRA) e honorários advocatícios, gerando relatórios profissionais em PDF para uso em processos judiciais.

> ⚖️ **Liquidação de Sentença** — fase processual em que se apura o valor exato da condenação.

---

## Funcionalidades

- **Cálculo de Diferenças Salariais** — insere lançamentos mensais com valor devido e valor recebido para apurar diferenças
- **Correção Monetária (IPCA-E)** — aplica o índice IPCA-E para períodos anteriores à EC 113/2021
- **SELIC (EC 113/2021)** — aplica a taxa SELIC acumulada a partir de 09/12/2021, que já engloba juros de mora
- **Juros de Mora** — calcula juros sobre a base corrigida desde a citação
- **Verbas Salariais (Rubricas)** — adiciona rubricas extras (auxílio-alimentação, transporte, periculosidade etc.) como valor fixo ou percentual, tributáveis ou não
- **Reflexos Automáticos** — 13º salário (1/12) e férias (4/3 de 1/12) calculados automaticamente sobre as diferenças base
- **Previdência Social** — 11% (até 31/12/2020) ou 14% (a partir de 01/01/2021) sobre a base tributável
- **Imposto de Renda (RRA)** — alíquota de 15% sobre a base tributável deduzida da previdência, com ressalva da IN RFB 1500/2014
- **Honorários Advocatícios** — percentual configurável sobre o total bruto
- **Exportação PDF** — relatório profissional em modo paisagem com logotipo, informações do caso, tabela de valores, observações e numeração de páginas
- **Importação de Dados** — importa índices e fichas financeiras via CSV ou colagem de texto
- **Persistência Local** — salva, busca, edita e exclui cálculos no navegador (localStorage)
- **Histórico de Cálculos** — consulta cálculos salvos com busca por nome, número do processo ou assunto

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript (strict mode) |
| Interface | React 18 |
| Roteamento | react-router-dom v6 |
| Bundler | Vite 5 |
| Estilos | Tailwind CSS 3 + variáveis CSS |
| PDF | jsPDF + jspdf-autotable |
| Gráficos | Recharts |
| Matemática | decimal.js (precisão arbitrária) |
| CSV | PapaParse |
| Ícones | Lucide React |
| Datas | date-fns |

---

## Estrutura do Projeto

```
SisLiqJud/
├── index.html                 # Entrada HTML
├── package.json               # Dependências e scripts
├── vite.config.ts             # Configuração do Vite
├── tsconfig.json              # Configuração do TypeScript
├── tailwind.config.js         # Configuração do Tailwind
├── postcss.config.js          # Configuração do PostCSS
│
├── src/                       # Código-fonte
│   ├── main.tsx               # Ponto de entrada da aplicação React
│   ├── App.tsx                # Componente raiz com roteamento
│   ├── index.css              # Estilos globais e design system
│   │
│   ├── components/
│   │   ├── CalculadoraJudicial.tsx   # Componente principal (calculadora)
│   │   └── HistoricoCalculos.tsx     # Página de histórico
│   │
│   └── logic/
│       ├── types.ts                  # Interfaces TypeScript (modelo de dados)
│       ├── calculator.ts             # Motor de cálculo (correção, juros, tributos)
│       ├── storage.ts                # Operações CRUD no localStorage
│       ├── exporter.ts               # Geração de relatórios PDF
│       └── importer.ts               # Importação de CSV/fichas financeiras
│
├── database/
│   └── schema.sql              # Schema PostgreSQL (referência para backend futuro)
│
└── scratch/
    └── test_calc.ts            # Script de teste manual
```

---

## Como Executar

### Pré-requisitos

- Node.js 18+
- npm

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### Build de Produção

```bash
npm run build
```

Os arquivos compilados serão gerados no diretório `dist/`.

### Preview do Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Como Usar

1. **Dados do Caso** — preencha número do processo, partes, datas de ajuizamento e citação, percentuais e opções tributárias
2. **Lançamentos Mensais** — adicione as competências com valores devidos e recebidos (use "Gerar Período" para criar meses em lote)
3. **Rubricas** — adicione verbas extras (vale-refeição, periculosidade etc.)
4. **Importar Índices** — cole os índices IPCA-E, SELIC e juros extraídos de PDFs oficiais ou importe CSV
5. **Revisar Resultados** — confira as tabelas de apuração, atualização e o resumo final
6. **Exportar PDF** — configure logotipo, dados do escritório e gere o relatório
7. **Salvar** — persista o cálculo no navegador para consulta futura

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila TypeScript + Vite build |
| `npm run lint` | Executa ESLint em todos os arquivos TS/TSX |
| `npm run preview` | Serve o build de produção localmente |

---

## Modelo de Dados (Backend Futuro)

O arquivo `database/schema.sql` contém o schema PostgreSQL planejado para uma versão backend, com tabelas para:

- `indice_ipca_e` — índices IPCA-E mensais
- `indice_selic` — taxas SELIC mensais
- `indice_juros` — taxas de juros de mora
- `processos` — processos/ cálculos
- `lancamentos_financeiros` — lançamentos financeiros vinculados a processos

> Atualmente o sistema opera **100% no frontend** com persistência em `localStorage`. O schema SQL é apenas uma referência arquitetural.

---

## Licença

Este projeto é de uso privado/restrito. Consulte o mantenedor para informações sobre licenciamento.
