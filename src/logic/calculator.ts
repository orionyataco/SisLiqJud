import { LancamentoMensal, HistoricoIndices, ParametrosCalculo, ResultadoMensal, ResumoFinal, IndiceMensal } from './types';
import { parseISO, isBefore, isAfter, startOfMonth, format } from 'date-fns';
import { Decimal } from 'decimal.js';

const DATA_TRANSICAO_EC113 = new Date(2021, 11, 9); // 09/12/2021
const DATA_TRANSICAO_PREVIDENCIA = new Date(2021, 0, 1); // 01/01/2021

// Configuração global para arredondamento financeiro
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const toDec = (val: number | string | undefined) => new Decimal(val || 0);

export function calcularDiferencas(
  lancamentos: LancamentoMensal[],
  indices: HistoricoIndices,
  parametros: ParametrosCalculo
): { resultados: ResultadoMensal[]; resumo: ResumoFinal } {
  
  const resultados: ResultadoMensal[] = lancamentos.map(lancamento => {
    const dataComp = startOfMonth(parseISO(`${lancamento.competencia}-01`));
    const baseDue = toDec(lancamento.valorDevido);
    const baseReceived = toDec(lancamento.valorRecebido);
    
    let diffTotalMes = baseDue.minus(baseReceived);
    let tributavelMes = lancamento.isTributavel ? baseDue.minus(baseReceived) : toDec(0);

    // Processar Verbas Extras
    const verbasDiferencas: { [verbaId: string]: number } = {};
    parametros.verbasConfiguradas.forEach(v => {
      let devidoV = toDec(0);
      let recebidoV = toDec(0);

      if (v.tipo === 'PERCENTUAL') {
        devidoV = baseDue.times(v.valor).dividedBy(100).toDecimalPlaces(2);
        recebidoV = baseReceived.times(v.valor).dividedBy(100).toDecimalPlaces(2);
      } else {
        const extra = lancamento.verbasExtras?.[v.id];
        devidoV = toDec(extra?.devido ?? v.valor);
        recebidoV = toDec(extra?.recebido ?? 0);
      }

      const diffV = devidoV.minus(recebidoV);
      verbasDiferencas[v.id] = diffV.toNumber();
      diffTotalMes = diffTotalMes.plus(diffV);
      if (v.isTributavel) {
        tributavelMes = tributavelMes.plus(diffV);
      }
    });
    
    // Reflexos Automáticos APENAS sobre a diferença do Vencimento (Salário Base)
    const diffSalarialBase = baseDue.minus(baseReceived);
    const reflexo13 = diffSalarialBase.dividedBy(12).toDecimalPlaces(2);
    const reflexoFerias = diffSalarialBase.dividedBy(12).times(4).dividedBy(3).toDecimalPlaces(2); 
    const baseTotalComReflexos = diffTotalMes.plus(reflexo13).plus(reflexoFerias);

    let valorCorrigido = baseTotalComReflexos;
    let valorJuros = toDec(0);
    let isSelic = false;

    let fatorCorrecaoObj = toDec(1.0);
    let jurosMoraObj = toDec(0);

    // Regra de Transição EC 113/2021
    if (isAfter(dataComp, DATA_TRANSICAO_EC113) || dataComp.getTime() === startOfMonth(DATA_TRANSICAO_EC113).getTime()) {
      isSelic = true;
      const fatorSelicAcumulada = toDec(buscarSelicAcumulada(dataComp, indices.selic));
      valorCorrigido = baseTotalComReflexos.times(fatorSelicAcumulada).toDecimalPlaces(2);
      valorJuros = toDec(0);
      fatorCorrecaoObj = fatorSelicAcumulada;
      jurosMoraObj = toDec(0);
    } else {
      isSelic = false;
      const fatorCorrecao = toDec(buscarFatorCorrecao(dataComp, indices.ipcaE));
      fatorCorrecaoObj = fatorCorrecao;
      valorCorrigido = baseTotalComReflexos.times(fatorCorrecao).toDecimalPlaces(2);

      const jurosMora = (isAfter(dataComp, parametros.dataCitacao) || dataComp.getTime() === startOfMonth(parametros.dataCitacao).getTime())
        ? toDec(calcularJurosAcumulados(dataComp, indices.jurosMora))
        : toDec(calcularJurosDesdeCitacao(parametros.dataCitacao, indices.jurosMora));
      
      jurosMoraObj = jurosMora;
      valorJuros = valorCorrigido.times(jurosMora).toDecimalPlaces(2);
    }

    const baseTributavelMes = tributavelMes.plus(lancamento.isTributavel ? reflexo13.plus(reflexoFerias) : toDec(0));

    // Cálculos de Previdência e IR (RRA)
    let valorPrevidenciaNominal = toDec(0);
    let valorPrevidenciaCorrigida = toDec(0);

    if (parametros.aplicarPrevidencia) {
      const aliquota = isBefore(dataComp, DATA_TRANSICAO_PREVIDENCIA) ? toDec(0.11) : toDec(0.14);
      const baseTribCorrigida = baseTributavelMes.times(fatorCorrecaoObj).toDecimalPlaces(2);
      const jurosBaseTrib = baseTribCorrigida.times(jurosMoraObj).toDecimalPlaces(2);
      
      valorPrevidenciaCorrigida = baseTribCorrigida.plus(jurosBaseTrib).times(aliquota).toDecimalPlaces(2);
      valorPrevidenciaNominal = baseTributavelMes.times(aliquota).toDecimalPlaces(2);
    }

    return {
      competencia: lancamento.competencia,
      valorDevido: baseDue.toNumber(),
      valorRecebido: baseReceived.toNumber(),
      diferencaVencimento: diffSalarialBase.toNumber(),
      diferencaNominal: diffTotalMes.toNumber(),
      verbasDiferencas,
      reflexo13: reflexo13.toNumber(),
      reflexoFerias: reflexoFerias.toNumber(),
      baseTributavel: baseTributavelMes.toNumber(),
      baseTributavelCorrigida: baseTributavelMes.times(fatorCorrecaoObj).toDecimalPlaces(2).toNumber(),
      fatorCorrecao: fatorCorrecaoObj.toNumber(), 
      valorCorrigido: valorCorrigido.toNumber(),
      jurosAcumulados: jurosMoraObj.toNumber(), 
      valorJuros: valorJuros.toNumber(),
      valorPrevidencia: valorPrevidenciaNominal.toNumber(),
      valorPrevidenciaCorrigida: valorPrevidenciaCorrigida.toNumber(),
      totalDoMes: valorCorrigido.plus(valorJuros).minus(valorPrevidenciaCorrigida).toNumber(),
      isSelic
    };
  });

  const sum = (arr: any[], fn: (r: any) => Decimal) => arr.reduce((acc, r) => acc.plus(fn(r)), toDec(0));

  const totalPrincipalCorrigido = sum(resultados, r => toDec(r.valorCorrigido).minus(toDec(r.reflexo13).plus(r.reflexoFerias)));
  const totalReflexo13 = sum(resultados, r => toDec(r.reflexo13));
  const totalReflexoFerias = sum(resultados, r => toDec(r.reflexoFerias));
  const totalJuros = sum(resultados, r => toDec(r.valorJuros));
  const totalBruto = sum(resultados, r => toDec(r.totalDoMes).plus(r.valorPrevidenciaCorrigida)); 
  const honorariosAdvocaticios = totalBruto.times(parametros.percentualHonorarios).dividedBy(100).toDecimalPlaces(2);

  const valorPrevidencia = sum(resultados, r => toDec(r.valorPrevidenciaCorrigida));

  const baseTributavelTotal = sum(resultados, r => toDec(r.baseTributavel));
  const valorIR = parametros.aplicarIR 
    ? baseTributavelTotal.minus(valorPrevidencia).times(0.15).toDecimalPlaces(2) 
    : toDec(0);

  const resumo: ResumoFinal = {
    totalPrincipalCorrigido: totalPrincipalCorrigido.toNumber(),
    totalReflexo13: totalReflexo13.toNumber(),
    totalReflexoFerias: totalReflexoFerias.toNumber(),
    totalJuros: totalJuros.toNumber(),
    totalBruto: totalBruto.toNumber(),
    honorariosAdvocaticios: honorariosAdvocaticios.toNumber(),
    valorPrevidencia: valorPrevidencia.toNumber(),
    valorIR: valorIR.toNumber(),
    valorLiquido: totalBruto.minus(valorPrevidencia).minus(valorIR).plus(honorariosAdvocaticios).toNumber()
  };

  return { resultados, resumo };
}

// Funções para buscar nos arrays de índices reais
function buscarFatorCorrecao(data: Date, ipcaE: IndiceMensal[]): number {
  const comp = format(data, 'yyyy-MM');
  const index = ipcaE.find(i => i.competencia === comp);
  return index ? index.valor : 1.0; 
}

function buscarSelicAcumulada(data: Date, selic: IndiceMensal[]): number {
  const comp = format(data, 'yyyy-MM');
  const index = selic.find(i => i.competencia === comp);
  return index ? index.valor : 1.0;
}

function calcularJurosAcumulados(data: Date, juros: IndiceMensal[]): number {
  const comp = format(data, 'yyyy-MM');
  const index = juros.find(i => i.competencia === comp);
  return index ? index.valor : 0; 
}

function calcularJurosDesdeCitacao(dataCitacao: Date, juros: IndiceMensal[]): number {
  const comp = format(dataCitacao, 'yyyy-MM');
  const index = juros.find(i => i.competencia === comp);
  return index ? index.valor : 0;
}
