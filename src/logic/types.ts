export type ModalidadeCalculo = 'SIMPLES' | 'BANCOS' | 'FAZENDA_PUBLICA';

export const MODALIDADE_LABELS: Record<ModalidadeCalculo, string> = {
  SIMPLES: 'Cálculo Simples (Débitos em Geral)',
  BANCOS: 'Bancos e Instituições Financeiras',
  FAZENDA_PUBLICA: 'Fazenda Pública'
};

export const MODALIDADE_DESCRIPTIONS: Record<ModalidadeCalculo, string> = {
  SIMPLES: 'IPCA/IPCA-E + Juros 1% a.m. ou Taxa Legal (Lei 14.905/2024)',
  BANCOS: 'IPCA/IPCA-E + Juros 12% a.a. ou Taxa Legal',
  FAZENDA_PUBLICA: 'IPCA-E + Juros Poupança (pré-EC 113) ou SELIC (pós-EC 113)'
};

export interface VerbaConfig {
  id: string;
  nome: string;
  isTributavel: boolean;
  tipo: 'FIXO' | 'PERCENTUAL';
  valor: number;
  incideSobre: 'SALARIO_BASE' | 'TOTAL_BRUTO';
}

export interface LancamentoMensal {
  competencia: string;
  valorDevido: number;
  valorRecebido: number;
  verbasExtras?: { [verbaId: string]: { devido: number; recebido: number } };
  isTributavel: boolean;
}

export interface IndiceMensal {
  competencia: string;
  valor: number;
}

export interface HistoricoIndices {
  ipcaE: IndiceMensal[];
  selic: IndiceMensal[];
  jurosMora: IndiceMensal[];
  ipca: IndiceMensal[];
  inpc: IndiceMensal[];
  poupanca: IndiceMensal[];
}

export interface ParametrosCalculo {
  modalidade: ModalidadeCalculo;
  nomeRequerente: string;
  nomeRequerido: string;
  numeroProcesso: string;
  dataAjuizamento: Date;
  dataCitacao: Date;
  dataSentenca: Date;
  percentualHonorarios: number;
  aplicarPrevidencia: boolean;
  aplicarIR: boolean;
  verbasConfiguradas: VerbaConfig[];
  tramitacao?: string;
  assunto?: string;
  orgaoPrevidenciario?: string;
  observacoesCustomizadas?: { titulo: string; descricao: string }[];
}

export interface ResultadoMensal {
  competencia: string;
  valorDevido: number;
  valorRecebido: number;
  diferencaVencimento: number;
  diferencaNominal: number;
  verbasDiferencas?: { [verbaId: string]: number };
  reflexo13: number;
  reflexoFerias: number;
  baseTributavel: number;
  baseTributavelCorrigida: number;
  indiceUtilizado: string;
  fatorCorrecao: number;
  taxaJuros: number;
  valorCorrigido: number;
  jurosAcumulados: number;
  valorJuros: number;
  valorPrevidencia: number;
  valorPrevidenciaCorrigida: number;
  totalDoMes: number;
  modalidade: ModalidadeCalculo;
}

export interface ResumoFinal {
  totalPrincipalCorrigido: number;
  totalReflexo13: number;
  totalReflexoFerias: number;
  totalJuros: number;
  totalBruto: number;
  honorariosAdvocaticios: number;
  valorPrevidencia: number;
  valorIR: number;
  valorLiquido: number;
}

export interface ConfiguracaoRelatorio {
  nomeEscritorio: string;
  enderecoEscritorio: string;
  telefoneEscritorio: string;
  emailEscritorio: string;
  corPrimaria: string;
  logoBase64?: string;
}

export interface CalculoSalvo {
  id: string;
  dataCriacao: string;
  dataAtualizacao: string;
  parametros: ParametrosCalculo;
  lancamentos: LancamentoMensal[];
  resumo: ResumoFinal;
}
