export interface VerbaConfig {
  id: string;
  nome: string;
  isTributavel: boolean;
  tipo: 'FIXO' | 'PERCENTUAL';
  valor: number; // Valor fixo ou % (ex: 20 para 20%)
  incideSobre: 'SALARIO_BASE' | 'TOTAL_BRUTO';
}

export interface LancamentoMensal {
  competencia: string; // "YYYY-MM"
  valorDevido: number; // Salário base devido
  valorRecebido: number; // Salário base recebido
  verbasExtras?: { [verbaId: string]: { devido: number; recebido: number } };
  isTributavel: boolean;
}

export interface IndiceMensal {
  competencia: string;
  valor: number; // Porcentagem ou fator
}

export interface HistoricoIndices {
  ipcaE: IndiceMensal[];
  selic: IndiceMensal[];
  jurosMora: IndiceMensal[];
}

export interface ParametrosCalculo {
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
  // Observações Customizadas (Título / Descrição)
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
  fatorCorrecao: number;
  valorCorrigido: number;
  jurosAcumulados: number;
  valorJuros: number;
  valorPrevidencia: number;
  valorPrevidenciaCorrigida: number; // Novo campo
  totalDoMes: number;
  isSelic: boolean;
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
