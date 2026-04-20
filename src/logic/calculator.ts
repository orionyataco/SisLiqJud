import { LancamentoMensal, HistoricoIndices, ParametrosCalculo, ResultadoMensal, ResumoFinal } from './types';
import { parseISO, isBefore, isAfter, startOfMonth, format } from 'date-fns';

const DATA_TRANSICAO_EC113 = new Date(2021, 11, 9); // 09/12/2021
const DATA_TRANSICAO_PREVIDENCIA = new Date(2021, 0, 1); // 01/01/2021

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export function calcularDiferencas(
  lancamentos: LancamentoMensal[],
  indices: HistoricoIndices,
  parametros: ParametrosCalculo
): { resultados: ResultadoMensal[]; resumo: ResumoFinal } {
  
  const resultados: ResultadoMensal[] = lancamentos.map(lancamento => {
    const dataComp = startOfMonth(parseISO(`${lancamento.competencia}-01`));
    const baseDue = lancamento.valorDevido;
    const baseReceived = lancamento.valorRecebido;
    let diffTotalMes = round2(baseDue - baseReceived);
    let tributavelMes = lancamento.isTributavel ? round2(baseDue - baseReceived) : 0;

    // Processar Verbas Extras
    const verbasDiferencas: { [verbaId: string]: number } = {};
    parametros.verbasConfiguradas.forEach(v => {
      let devidoV = 0;
      let recebidoV = 0;

      if (v.tipo === 'PERCENTUAL') {
        devidoV = round2(baseDue * (v.valor / 100));
        recebidoV = round2(baseReceived * (v.valor / 100));
      } else {
        const extra = lancamento.verbasExtras?.[v.id];
        devidoV = extra?.devido ?? v.valor;
        recebidoV = extra?.recebido ?? 0;
      }

      const diffV = round2(devidoV - recebidoV);
      verbasDiferencas[v.id] = diffV;
      diffTotalMes = round2(diffTotalMes + diffV);
      if (v.isTributavel) {
        tributavelMes = round2(tributavelMes + diffV);
      }
    });
    
    // Reflexos Automáticos APENAS sobre a diferença do Vencimento (Salário Base)
    const diffSalarialBase = round2(baseDue - baseReceived);
    const reflexo13 = round2(diffSalarialBase / 12);
    const reflexoFerias = round2((diffSalarialBase / 12) * (4 / 3)); 
    const baseTotalComReflexos = round2(diffTotalMes + reflexo13 + reflexoFerias);

    let valorCorrigido = baseTotalComReflexos;
    let valorJuros = 0;
    let isSelic = false;

    let fatorCorrecaoObj = 1.0;
    let jurosMoraObj = 0;

    // Regra de Transição EC 113/2021
    if (isAfter(dataComp, DATA_TRANSICAO_EC113) || dataComp.getTime() === startOfMonth(DATA_TRANSICAO_EC113).getTime()) {
      isSelic = true;
      const fatorSelicAcumulada = buscarSelicAcumulada(dataComp, indices.selic);
      valorCorrigido = round2(baseTotalComReflexos * fatorSelicAcumulada);
      valorJuros = 0;
      fatorCorrecaoObj = fatorSelicAcumulada;
      jurosMoraObj = 0;
    } else {
      isSelic = false;
      const fatorCorrecao = buscarFatorCorrecao(dataComp, indices.ipcaE);
      fatorCorrecaoObj = fatorCorrecao;
      valorCorrigido = round2(baseTotalComReflexos * fatorCorrecao);

      if (isAfter(dataComp, parametros.dataCitacao) || dataComp.getTime() === startOfMonth(parametros.dataCitacao).getTime()) {
        const jurosMora = calcularJurosAcumulados(dataComp, indices.jurosMora);
        jurosMoraObj = jurosMora;
        valorJuros = round2(valorCorrigido * jurosMora);
      } else {
        const jurosMora = calcularJurosDesdeCitacao(parametros.dataCitacao, indices.jurosMora);
        jurosMoraObj = jurosMora;
        valorJuros = round2(valorCorrigido * jurosMora);
      }
    }

    const baseTributavelMes = round2(tributavelMes + (lancamento.isTributavel ? (reflexo13 + reflexoFerias) : 0));

    // Cálculos de Previdência e IR (RRA)
    let valorPrevidenciaNominal = 0;
    let valorPrevidenciaCorrigida = 0;

    if (parametros.aplicarPrevidencia) {
      const aliquota = isBefore(dataComp, DATA_TRANSICAO_PREVIDENCIA) ? 0.11 : 0.14;
      const baseTribCorrigida = round2(baseTributavelMes * fatorCorrecaoObj);
      const jurosBaseTrib = round2(baseTribCorrigida * jurosMoraObj);
      
      valorPrevidenciaCorrigida = round2((baseTribCorrigida + jurosBaseTrib) * aliquota);
      valorPrevidenciaNominal = round2(baseTributavelMes * aliquota);
    }

    return {
      competencia: lancamento.competencia,
      valorDevido: baseDue,
      valorRecebido: baseReceived,
      diferencaVencimento: round2(baseDue - baseReceived),
      diferencaNominal: diffTotalMes,
      verbasDiferencas,
      reflexo13,
      reflexoFerias,
      baseTributavel: baseTributavelMes,
      baseTributavelCorrigida: round2(baseTributavelMes * fatorCorrecaoObj),
      fatorCorrecao: fatorCorrecaoObj, 
      valorCorrigido,
      jurosAcumulados: jurosMoraObj, 
      valorJuros,
      valorPrevidencia: valorPrevidenciaNominal,
      valorPrevidenciaCorrigida: valorPrevidenciaCorrigida,
      totalDoMes: round2(valorCorrigido + valorJuros - valorPrevidenciaCorrigida),
      isSelic
    };
  });

  const totalPrincipalCorrigido = round2(resultados.reduce((acc, r) => acc + (r.valorCorrigido - (r.reflexo13 + r.reflexoFerias)), 0));
  const totalReflexo13 = round2(resultados.reduce((acc, r) => acc + r.reflexo13, 0));
  const totalReflexoFerias = round2(resultados.reduce((acc, r) => acc + r.reflexoFerias, 0));
  const totalJuros = round2(resultados.reduce((acc, r) => acc + r.valorJuros, 0));
  const totalBruto = round2(resultados.reduce((acc, r) => acc + r.totalDoMes + r.valorPrevidenciaCorrigida, 0)); 
  const honorariosAdvocaticios = round2(totalBruto * (parametros.percentualHonorarios / 100));

  const valorPrevidencia = round2(resultados.reduce((acc, r) => acc + r.valorPrevidenciaCorrigida, 0));

  const baseTributavelTotal = round2(resultados.reduce((acc, r) => acc + r.baseTributavel, 0));
  const valorIR = parametros.aplicarIR ? round2((baseTributavelTotal - valorPrevidencia) * 0.15) : 0;

  const resumo: ResumoFinal = {
    totalPrincipalCorrigido,
    totalReflexo13,
    totalReflexoFerias,
    totalJuros,
    totalBruto,
    honorariosAdvocaticios,
    valorPrevidencia,
    valorIR,
    valorLiquido: round2(totalBruto - valorPrevidencia - valorIR + honorariosAdvocaticios)
  };

  return { resultados, resumo };
}

// Funções para buscar nos arrays de índices reais
function buscarFatorCorrecao(data: Date, ipcaE: IndiceMensal[]): number {
  const comp = format(data, 'yyyy-MM');
  const index = ipcaE.find(i => i.competencia === comp);
  return index ? index.valor : 1.0; // 1.0 significa sem correção se não encontrar
}

function buscarSelicAcumulada(data: Date, selic: IndiceMensal[]): number {
  const comp = format(data, 'yyyy-MM');
  const index = selic.find(i => i.competencia === comp);
  return index ? index.valor : 1.0;
}

function calcularJurosAcumulados(data: Date, juros: IndiceMensal[]): number {
  const comp = format(data, 'yyyy-MM');
  const index = juros.find(i => i.competencia === comp);
  // Juros normalmente vêm como % (ex: 0.5 para 50%). Se for % dividimos por 100 se necessário, 
  // mas aqui assumimos que o valor colado já é o fator (ex: 0.12 para 12%)
  return index ? index.valor : 0; 
}

function calcularJurosDesdeCitacao(dataCitacao: Date, juros: IndiceMensal[]): number {
  const comp = format(dataCitacao, 'yyyy-MM');
  const index = juros.find(i => i.competencia === comp);
  return index ? index.valor : 0;
}
