import { LancamentoMensal, HistoricoIndices, ParametrosCalculo, ResultadoMensal, ResumoFinal, IndiceMensal, ModalidadeCalculo } from './types';
import { parseISO, isBefore, isAfter, startOfMonth, format } from 'date-fns';
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const toDec = (val: number | string | undefined) => new Decimal(val || 0);

const DATA_EC113 = new Date(2021, 11, 9);
const DATA_LEI_14905 = new Date(2024, 7, 30);
const DATA_TRANSICAO_PREVIDENCIA = new Date(2021, 0, 1);

function buscarPorCompetencia(competencia: string, arr: IndiceMensal[]): number {
  const index = arr.find(i => i.competencia === competencia);
  return index ? index.valor : 0;
}

function buscarFatorCorrecao(data: Date, arr: IndiceMensal[]): number {
  return buscarPorCompetencia(format(data, 'yyyy-MM'), arr);
}

function getIndicesParaModalidade(
  dataComp: Date,
  modalidade: ModalidadeCalculo,
  indices: HistoricoIndices
): { indice: string; fatorCorrecao: Decimal; fatorJuros: Decimal } {
  const comp = format(dataComp, 'yyyy-MM');

  switch (modalidade) {
    case 'SIMPLES':
    case 'BANCOS': {
      if (!isAfter(dataComp, DATA_LEI_14905)) {
        const fIPCAE = toDec(buscarPorCompetencia(comp, indices.ipcaE) || 1);
        const fJuros = toDec(buscarPorCompetencia(comp, indices.jurosMora));
        return {
          indice: fJuros.gt(0) ? 'IPCA-E + Juros' : 'IPCA-E (sem juros)',
          fatorCorrecao: fIPCAE,
          fatorJuros: fJuros
        };
      } else {
        const fIPCA = toDec(buscarPorCompetencia(comp, indices.ipca) || 1);
        const fSelic = toDec(buscarPorCompetencia(comp, indices.selic));
        const taxaLegal = Decimal.max(0, fSelic.minus(fIPCA));
        return {
          indice: taxaLegal.gt(0) ? 'IPCA + Tx. Legal' : 'IPCA (taxa legal = 0)',
          fatorCorrecao: fIPCA,
          fatorJuros: taxaLegal
        };
      }
    }

    case 'FAZENDA_PUBLICA': {
      if (!isAfter(dataComp, DATA_EC113)) {
        const fIPCAE = toDec(buscarPorCompetencia(comp, indices.ipcaE) || 1);
        const fPoupanca = toDec(buscarPorCompetencia(comp, indices.poupanca));
        return {
          indice: fPoupanca.gt(0) ? 'IPCA-E + Poupança' : 'IPCA-E (sem juros)',
          fatorCorrecao: fIPCAE,
          fatorJuros: fPoupanca
        };
      } else {
        const fSelic = toDec(buscarPorCompetencia(comp, indices.selic));
        return {
          indice: 'SELIC (EC 113)',
          fatorCorrecao: fSelic.gt(0) ? fSelic : toDec(1),
          fatorJuros: toDec(0)
        };
      }
    }
  }
}

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

    const verbasDiferencas: { [verbaId: string]: number } = {};
    parametros.verbasConfiguradas.forEach(v => {
      let devidoV = toDec(0);
      let recebidoV = toDec(0);

      if (v.tipo === 'PERCENTUAL') {
        const baseRef = v.incideSobre === 'TOTAL_BRUTO' ? diffTotalMes : baseDue.minus(baseReceived);
        devidoV = baseRef.times(v.valor).dividedBy(100).toDecimalPlaces(2);
        recebidoV = toDec(0);
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

    const diffSalarialBase = baseDue.minus(baseReceived);
    const reflexo13 = diffSalarialBase.dividedBy(12).toDecimalPlaces(2);
    const reflexoFerias = diffSalarialBase.dividedBy(12).times(4).dividedBy(3).toDecimalPlaces(2);
    const baseTotalComReflexos = diffTotalMes.plus(reflexo13).plus(reflexoFerias);

    const { indice, fatorCorrecao, fatorJuros } = getIndicesParaModalidade(
      dataComp,
      parametros.modalidade || 'SIMPLES',
      indices
    );

    const valorCorrigido = baseTotalComReflexos.times(fatorCorrecao).toDecimalPlaces(2);

    const isSelicBased = indice === 'SELIC (EC 113)';
    const valorJuros = isSelicBased
      ? toDec(0)
      : baseTotalComReflexos.times(fatorJuros).toDecimalPlaces(2);

    const baseTributavelMes = tributavelMes.plus(
      lancamento.isTributavel ? reflexo13.plus(reflexoFerias) : toDec(0)
    );

    let valorPrevidenciaNominal = toDec(0);
    let valorPrevidenciaCorrigida = toDec(0);

    if (parametros.aplicarPrevidencia) {
      const aliquota = isBefore(dataComp, DATA_TRANSICAO_PREVIDENCIA) ? toDec(0.11) : toDec(0.14);
      const baseTribCorrigida = baseTributavelMes.times(fatorCorrecao).toDecimalPlaces(2);
      const jurosBaseTrib = isSelicBased ? toDec(0) : baseTribCorrigida.times(fatorJuros).toDecimalPlaces(2);

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
      baseTributavelCorrigida: baseTributavelMes.times(fatorCorrecao).toDecimalPlaces(2).toNumber(),
      indiceUtilizado: indice,
      fatorCorrecao: fatorCorrecao.toNumber(),
      taxaJuros: fatorJuros.toNumber(),
      valorCorrigido: valorCorrigido.toNumber(),
      jurosAcumulados: fatorJuros.toNumber(),
      valorJuros: valorJuros.toNumber(),
      valorPrevidencia: valorPrevidenciaNominal.toNumber(),
      valorPrevidenciaCorrigida: valorPrevidenciaCorrigida.toNumber(),
      totalDoMes: valorCorrigido.plus(valorJuros).minus(valorPrevidenciaCorrigida).toNumber(),
      modalidade: parametros.modalidade || 'SIMPLES'
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

  const valorLiquido = totalBruto.minus(valorPrevidencia).minus(valorIR).minus(honorariosAdvocaticios);

  const resumo: ResumoFinal = {
    totalPrincipalCorrigido: totalPrincipalCorrigido.toNumber(),
    totalReflexo13: totalReflexo13.toNumber(),
    totalReflexoFerias: totalReflexoFerias.toNumber(),
    totalJuros: totalJuros.toNumber(),
    totalBruto: totalBruto.toNumber(),
    honorariosAdvocaticios: honorariosAdvocaticios.toNumber(),
    valorPrevidencia: valorPrevidencia.toNumber(),
    valorIR: valorIR.toNumber(),
    valorLiquido: valorLiquido.toNumber()
  };

  return { resultados, resumo };
}
